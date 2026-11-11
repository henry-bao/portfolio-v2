import { z } from 'zod';
import { input, parseInput, read } from './core/fields';
import { FOLDERS, deleteFileQuietly, swapFile } from './core/files';
import type { FileChange } from './core/files';
import { defineTable } from './core/table';
import type { TableRow } from './core/table';
import { runTransaction } from './core/transactions';

const projectsTable = defineTable(
    'project',
    'projects',
    {
        title: read.string(),
        role: read.string(),
        date: read.string(),
        description: read.textList(),
        logoFileId: read.text(),
        link_url: read.httpUrl(),
        link_text: read.text(),
        isOpen: read.flag(false),
        /** Position on the home page, ascending. Older rows may have none; they sort last. */
        order: z.number().int().nullish().transform((order) => order ?? null),
    }
);

export type Project = TableRow<typeof projectsTable>;

/** Most project columns are limited to 99 characters by the Appwrite schema. */
const COLUMN_SIZE = 99;

export const DEFAULT_LINK_TEXT = 'Click here to learn more';

export const projectInputSchema = z
    .object({
        title: input.requiredText('Title', COLUMN_SIZE),
        role: input.requiredText('Role', COLUMN_SIZE),
        date: input.requiredText('Date', COLUMN_SIZE),
        description: input
            .textList('Description', 9999)
            .refine((items) => items.length > 0, 'Add at least one description item'),
        isOpen: z.boolean().default(false),
        link_url: input.optionalHttpUrl('Link URL', COLUMN_SIZE),
        link_text: input.optionalText('Link text', COLUMN_SIZE),
    })
    // A link without text would render as an empty anchor; a text without a link means nothing.
    .transform((project) => ({
        ...project,
        link_text: project.link_url ? (project.link_text ?? DEFAULT_LINK_TEXT) : null,
    }));

export type ProjectInput = z.input<typeof projectInputSchema>;

/** Explicit order first, then creation time, so the result is stable even for unordered rows. */
const byDisplayOrder = (a: Project, b: Project) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.$createdAt.localeCompare(b.$createdAt);

export const listProjects = async () => (await projectsTable.listAll()).sort(byDisplayOrder);

export const getProject = (projectId: string) => projectsTable.get(projectId);

const pickEditable = ({ title, role, date, description, isOpen, link_url, link_text, logoFileId }: Project) => ({
    title,
    role,
    date,
    description,
    isOpen,
    link_url,
    link_text,
    logoFileId,
});

/**
 * Creates a project (placed last) or updates `current`, swapping the logo if `logo` asks for it.
 * Updates are refused if someone else edited the project after `current` was loaded.
 */
export async function saveProject({
    current,
    values,
    logo,
}: {
    current: Project | null;
    values: ProjectInput;
    logo: FileChange;
}): Promise<Project> {
    const data = parseInput(projectInputSchema, values);

    return swapFile({
        currentFileId: current?.logoFileId ?? null,
        change: logo,
        kind: 'image',
        folder: FOLDERS.projects,
        commit: async (logoFileId) => {
            if (current) {
                return projectsTable.update(current.$id, { ...data, logoFileId }, { expected: pickEditable(current) });
            }

            const existing = await projectsTable.listAll();
            const nextOrder = Math.max(-1, ...existing.map((project) => project.order ?? -1)) + 1;
            return projectsTable.create({ ...data, logoFileId, order: nextOrder });
        },
    });
}

export async function deleteProject(project: Project) {
    await projectsTable.remove(project.$id);
    await deleteFileQuietly(project.logoFileId);
}

/** Persists a new order in one transaction. Only rows whose position actually changed are written. */
export async function reorderProjects(orderedProjects: Project[]) {
    const changes = orderedProjects
        .map((project, order) => ({ project, order }))
        .filter(({ project, order }) => project.order !== order);

    if (changes.length === 0) {
        return;
    }

    await runTransaction('Reorder projects', async (transactionId) => {
        for (const { project, order } of changes) {
            await projectsTable.stage.update(transactionId, project.$id, { order });
        }
    });
}
