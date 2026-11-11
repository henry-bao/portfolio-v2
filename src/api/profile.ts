import { Query } from 'appwrite';
import { z } from 'zod';
import { input, parseInput, read } from './core/fields';
import { FOLDERS, swapFile } from './core/files';
import type { FileChange } from './core/files';
import { defineTable } from './core/table';
import type { TableRow } from './core/table';

/**
 * The site owner's profile: a single row (the oldest, if duplicates ever appear).
 *
 * The resume is not part of the profile: the active row of the resumes table is the only source of
 * truth for it (see resumes.ts).
 */
const profileTable = defineTable(
    'profile',
    'profile',
    {
        name: read.string(),
        email: read.string(),
        pronouns: read.textList(),
        education: read.textList(),
        languages: read.textList(),
        linkedin: read.httpUrl(),
        github: read.httpUrl(),
        profileImageId: read.text(),
    }
);

export type Profile = TableRow<typeof profileTable>;

/** Column limits come from the Appwrite schema (99 characters for every profile column). */
const COLUMN_SIZE = 99;

export const profileInputSchema = z.object({
    name: input.requiredText('Name', COLUMN_SIZE),
    email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .max(COLUMN_SIZE, `Email must be at most ${COLUMN_SIZE} characters`)
        .pipe(z.email('Enter a valid email address')),
    pronouns: input.textList('Pronouns', COLUMN_SIZE),
    education: input.textList('Education', COLUMN_SIZE),
    languages: input.textList('Languages', COLUMN_SIZE),
    linkedin: input.optionalHttpUrl('LinkedIn URL', COLUMN_SIZE),
    github: input.optionalHttpUrl('GitHub URL', COLUMN_SIZE),
});

export type ProfileInput = z.input<typeof profileInputSchema>;

/** Fixed id for the first save, so a double-submit can't create two profiles. */
const PROFILE_ROW_ID = 'profile';

/** `null` until a profile has been saved. */
export const getProfile = () => profileTable.first([Query.orderAsc('$createdAt')]);

/**
 * Creates or updates the profile, and swaps the photo if `photo` asks for it.
 * `current` is the profile the editor loaded; its values guard against overwriting newer edits.
 */
export async function saveProfile({
    current,
    values,
    photo,
}: {
    current: Profile | null;
    values: ProfileInput;
    photo: FileChange;
}): Promise<Profile> {
    const data = parseInput(profileInputSchema, values);

    return swapFile({
        currentFileId: current?.profileImageId ?? null,
        change: photo,
        kind: 'image',
        folder: FOLDERS.profile,
        commit: (profileImageId) =>
            current
                ? profileTable.update(
                      current.$id,
                      { ...data, profileImageId },
                      { expected: pickEditable(current) }
                  )
                : profileTable.create({ ...data, profileImageId }, { rowId: PROFILE_ROW_ID }),
    });
}

const pickEditable = ({ name, email, pronouns, education, languages, linkedin, github, profileImageId }: Profile) => ({
    name,
    email,
    pronouns,
    education,
    languages,
    linkedin,
    github,
    profileImageId,
});
