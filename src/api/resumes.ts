import { ID, Query } from 'appwrite';
import { z } from 'zod';
import { RESUME_FILE_NAME } from '../config/site';
import { input, parseInput, read } from './core/fields';
import { FOLDERS, deleteFileQuietly, uploadFile, validateFile } from './core/files';
import { publicReadWhen } from './core/permissions';
import { defineTable } from './core/table';
import type { TableRow } from './core/table';
import { runTransaction } from './core/transactions';

/**
 * Resume versions. Exactly one row is active; it is the public resume, served at `/resume`
 * (api/resume.ts on Vercel, the ResumeRedirect page elsewhere).
 *
 * Every version keeps its own file id. Appwrite's file view URLs are cached by browsers for 45 days,
 * so overwriting one fixed "current" file would keep serving stale copies.
 *
 * Activation changes always run in a single transaction, so the table never ends up with zero or two
 * active rows. Only the active row is publicly readable (once row security is on for this table).
 */
const resumesTable = defineTable(
    'resume',
    'resumes',
    {
        fileId: z.string().min(1),
        fileName: read.string(),
        uploadDate: z.string(),
        isActive: read.flag(false),
        description: read.text(),
    }
);

export type Resume = TableRow<typeof resumesTable>;

export const resumeDetailsSchema = z.object({
    fileName: input.requiredText('File name', 999),
    description: input.optionalText('Description', 9999),
});

export type ResumeDetailsInput = z.input<typeof resumeDetailsSchema>;

const newestFirst = Query.orderDesc('uploadDate');

const activeState = (isActive: boolean) => ({
    data: { isActive },
    options: { permissions: publicReadWhen(isActive) },
});

export const listResumes = () => resumesTable.listAll([newestFirst]);

/** The public resume, or `null` when none is active. If two ever are, the newest wins. */
export const getActiveResume = () => resumesTable.first([Query.equal('isActive', true), newestFirst]);

const listActive = () => resumesTable.listAll([Query.equal('isActive', true)]);

const stageDeactivateOthers = async (transactionId: string, keepRowId: string, currentlyActive: Resume[]) => {
    const { data, options } = activeState(false);

    for (const row of currentlyActive) {
        if (row.$id !== keepRowId) {
            await resumesTable.stage.update(transactionId, row.$id, data, options);
        }
    }
};

/** Stages "make `rowId` the only active version": activate it, deactivate every other active row. */
const stageActivation = async (transactionId: string, rowId: string, currentlyActive: Resume[]) => {
    const { data, options } = activeState(true);

    await resumesTable.stage.update(transactionId, rowId, data, options);
    await stageDeactivateOthers(transactionId, rowId, currentlyActive);
};

export async function setActiveResume(rowId: string) {
    const currentlyActive = await listActive();
    await runTransaction('Set active resume', (transactionId) => stageActivation(transactionId, rowId, currentlyActive));
}

/**
 * Uploads a new version. It becomes active when `activate` is set, or when no version is active yet
 * (so the first upload is always live).
 */
export async function uploadResume({
    file,
    description,
    activate,
}: {
    file: File;
    description?: string | null;
    activate: boolean;
}) {
    const invalid = validateFile(file, 'pdf');

    if (invalid) {
        throw invalid;
    }

    const details = parseInput(resumeDetailsSchema, { fileName: file.name.slice(0, 999), description });
    const currentlyActive = await listActive();
    const makeActive = activate || currentlyActive.length === 0;
    const storedFile = new File([file], RESUME_FILE_NAME, { type: 'application/pdf' });
    const uploaded = await uploadFile(storedFile, { kind: 'pdf', folder: FOLDERS.resumes });
    const rowId = ID.unique();

    try {
        await runTransaction('Add resume', async (transactionId) => {
            const state = activeState(makeActive);

            await resumesTable.stage.create(
                transactionId,
                { ...details, fileId: uploaded.$id, uploadDate: new Date().toISOString(), ...state.data },
                { ...state.options, rowId }
            );

            if (makeActive) {
                await stageDeactivateOthers(transactionId, rowId, currentlyActive);
            }
        });
    } catch (error) {
        await deleteFileQuietly(uploaded.$id);
        throw error;
    }

    return { rowId, isActive: makeActive };
}

export const updateResumeDetails = (rowId: string, values: ResumeDetailsInput) =>
    resumesTable.update(rowId, parseInput(resumeDetailsSchema, values));

/**
 * Deletes a version and its file. Deleting the active version promotes the newest remaining one in
 * the same transaction, so `/resume` keeps working whenever any version is left.
 */
export async function deleteResume(resume: Resume) {
    // Re-read: the caller's copy may be stale about which version is active.
    const current = await resumesTable.find(resume.$id);

    if (current) {
        const replacement = current.isActive
            ? await resumesTable.first([Query.notEqual('$id', current.$id), newestFirst])
            : null;
        const otherActive = replacement ? (await listActive()).filter((row) => row.$id !== current.$id) : [];

        await runTransaction('Delete resume', async (transactionId) => {
            await resumesTable.stage.remove(transactionId, current.$id);

            if (replacement) {
                await stageActivation(transactionId, replacement.$id, otherActive);
            }
        });
    }

    await deleteFileQuietly(current?.fileId ?? resume.fileId);
}
