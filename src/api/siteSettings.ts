import { Query } from 'appwrite';
import { toApiError } from './core/errors';
import { read } from './core/fields';
import { defineTable } from './core/table';
import type { TableRow } from './core/table';

/**
 * Which home-page sections are shown. Stored as a single row; if the table ever holds more than one,
 * the oldest wins so the choice is stable.
 */
const siteSettingsTable = defineTable(
    'site settings',
    'siteSettings',
    {
        about: read.flag(true),
        projects: read.flag(true),
        blogs: read.flag(true),
        /** Kept for the existing column; nothing reads it yet. */
        resumes: read.flag(true),
    }
);

type SiteSettingsRow = TableRow<typeof siteSettingsTable>;

export type SiteSection = 'about' | 'projects' | 'blogs' | 'resumes';
export type SiteSettings = Record<SiteSection, boolean>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = { about: true, projects: true, blogs: true, resumes: true };

/** Fixed id, so two first-time saves racing each other can't create two rows. */
const SETTINGS_ROW_ID = 'site-settings';

const toSettings = ({ about, projects, blogs, resumes }: SiteSettingsRow): SiteSettings => ({
    about,
    projects,
    blogs,
    resumes,
});

const getSettingsRow = () => siteSettingsTable.first([Query.orderAsc('$createdAt')]);

/** The saved settings, or the defaults when none have been saved yet. */
export const getSiteSettings = async (): Promise<SiteSettings> => {
    const row = await getSettingsRow();
    return row ? toSettings(row) : DEFAULT_SITE_SETTINGS;
};

export async function updateSiteSettings(changes: Partial<SiteSettings>): Promise<SiteSettings> {
    const row = await getSettingsRow();

    if (row) {
        return toSettings(await siteSettingsTable.update(row.$id, changes));
    }

    try {
        return toSettings(
            await siteSettingsTable.create({ ...DEFAULT_SITE_SETTINGS, ...changes }, { rowId: SETTINGS_ROW_ID })
        );
    } catch (error) {
        // Someone else created it between our read and write: apply the change to theirs.
        if (toApiError(error).kind === 'conflict') {
            return toSettings(await siteSettingsTable.update(SETTINGS_ROW_ID, changes));
        }
        throw error;
    }
}
