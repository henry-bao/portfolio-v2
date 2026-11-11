import { beforeEach, describe, expect, test } from 'bun:test';
import { fakeAppwrite, resetFakeAppwrite } from '../fakeBackend';
import { DEFAULT_LINK_TEXT, listProjects, reorderProjects, saveProject } from '../../src/api/projects';
import type { ProjectInput } from '../../src/api/projects';
import { getProfile, saveProfile } from '../../src/api/profile';
import { DEFAULT_SITE_SETTINGS, getSiteSettings, updateSiteSettings } from '../../src/api/siteSettings';
import { KEEP_FILE, swapFile, validateFile } from '../../src/api/core/files';
import { isApiError } from '../../src/api/core/errors';

beforeEach(() => {
    resetFakeAppwrite();
});

const project = (overrides: Partial<ProjectInput> = {}): ProjectInput => ({
    title: 'Project',
    role: 'Engineer',
    date: '2024',
    description: ['Did things'],
    isOpen: false,
    link_url: '',
    link_text: '',
    ...overrides,
});

describe('projects', () => {
    test('new projects go last, and unordered legacy rows sort after ordered ones', async () => {
        fakeAppwrite().seed('projects', [
            { $id: 'legacy', title: 'Legacy', role: 'r', date: 'd' },
            { $id: 'first', title: 'First', role: 'r', date: 'd', order: 0 },
        ]);

        const created = await saveProject({ current: null, values: project({ title: 'New' }), logo: KEEP_FILE });

        expect(created.order).toBe(1);
        expect((await listProjects()).map((row) => row.title)).toEqual(['First', 'New', 'Legacy']);
    });

    test('a link gets default text; no link means no text', async () => {
        const withLink = await saveProject({
            current: null,
            values: project({ link_url: 'https://example.com' }),
            logo: KEEP_FILE,
        });
        const withoutLink = await saveProject({ current: null, values: project({ link_text: 'orphan' }), logo: KEEP_FILE });

        expect(withLink.link_text).toBe(DEFAULT_LINK_TEXT);
        expect(withoutLink.link_text).toBeNull();
    });

    test('needs at least one description item', async () => {
        const error = await saveProject({ current: null, values: project({ description: ['  '] }), logo: KEEP_FILE }).catch(
            (caught: unknown) => caught
        );
        expect(isApiError(error, 'invalid_input')).toBe(true);
    });

    test('reordering only writes rows whose position changed', async () => {
        fakeAppwrite().seed('projects', [
            { $id: 'a', title: 'A', role: 'r', date: 'd', order: 0 },
            { $id: 'b', title: 'B', role: 'r', date: 'd', order: 1 },
            { $id: 'c', title: 'C', role: 'r', date: 'd', order: 2 },
        ]);
        const [a, b, c] = await listProjects();
        const untouchedUpdatedAt = a.$updatedAt;

        await reorderProjects([a, c, b]);

        const after = await listProjects();
        expect(after.map((row) => row.$id)).toEqual(['a', 'c', 'b']);
        expect(after[0].$updatedAt).toBe(untouchedUpdatedAt);
    });
});

describe('profile', () => {
    test('the first save creates the profile under a fixed id, so a double submit cannot duplicate it', async () => {
        const values = { name: 'Henry', email: 'henry@example.com', pronouns: [], education: [], languages: [] };

        await saveProfile({ current: null, values, photo: KEEP_FILE });
        const error = await saveProfile({ current: null, values, photo: KEEP_FILE }).catch((caught: unknown) => caught);

        expect(isApiError(error, 'conflict')).toBe(true);
        expect(fakeAppwrite().rows('profile')).toHaveLength(1);
    });

    test('rejects a bad email and unsafe links', async () => {
        const error = await saveProfile({
            current: null,
            values: { name: 'Henry', email: 'nope', linkedin: 'javascript:alert(1)' },
            photo: KEEP_FILE,
        }).catch((caught: unknown) => caught);

        expect(Object.keys((error as { fieldErrors: object }).fieldErrors).sort()).toEqual(['email', 'linkedin']);
    });

    test('removing the photo clears the column and deletes the file', async () => {
        const photo = new File(['png'], 'me.png', { type: 'image/png' });
        const values = { name: 'Henry', email: 'henry@example.com' };
        const withPhoto = await saveProfile({ current: null, values, photo: { type: 'replace', file: photo } });

        const without = await saveProfile({ current: withPhoto, values, photo: { type: 'remove' } });

        expect(without.profileImageId).toBeNull();
        expect(fakeAppwrite().files.size).toBe(0);
        expect((await getProfile())?.profileImageId).toBeNull();
    });
});

describe('site settings', () => {
    test('defaults to everything visible when nothing is saved', async () => {
        expect(await getSiteSettings()).toEqual(DEFAULT_SITE_SETTINGS);
    });

    test('the oldest row wins when duplicates exist, and updates go to it', async () => {
        fakeAppwrite().seed('settings', [
            { $id: 'oldest', about: true, projects: true, blogs: false, resumes: true },
            { $id: 'newer', about: true, projects: false, blogs: true, resumes: true },
        ]);

        expect((await getSiteSettings()).blogs).toBe(false);

        await updateSiteSettings({ blogs: true });
        expect(fakeAppwrite().rows('settings').find((row) => row.$id === 'oldest')?.blogs).toBe(true);
    });

    test('the first save creates a single row with the defaults filled in', async () => {
        const saved = await updateSiteSettings({ projects: false });

        expect(saved).toEqual({ ...DEFAULT_SITE_SETTINGS, projects: false });
        expect(fakeAppwrite().rows('settings')).toHaveLength(1);
    });
});

describe('files', () => {
    test('validateFile accepts by extension when the browser reports no type', () => {
        expect(validateFile(new File(['x'], 'photo.webp', { type: '' }), 'image')).toBeNull();
        expect(validateFile(new File(['x'], 'notes.txt', { type: '' }), 'image')?.kind).toBe('invalid_input');
        expect(validateFile(new File([], 'empty.png', { type: 'image/png' }), 'image')?.kind).toBe('invalid_input');
    });

    test('validateFile enforces the size limit', () => {
        const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.png', { type: 'image/png' });
        expect(validateFile(big, 'image')?.message).toContain('too large');
    });

    test('swapFile keeps the old file when the commit fails', async () => {
        fakeAppwrite().files.set('old', { $id: 'old', name: 'old.png', mimeType: 'image/png', sizeOriginal: 1, folder: 'projects/' });

        await swapFile({
            currentFileId: 'old',
            change: { type: 'replace', file: new File(['png'], 'new.png', { type: 'image/png' }) },
            kind: 'image',
            folder: 'projects',
            commit: async () => {
                throw new Error('row write failed');
            },
        }).catch(() => {});

        expect([...fakeAppwrite().files.keys()]).toEqual(['old']);
    });
});

test('fileUrl builds the stable view URL that gets stored in post bodies', async () => {
    const { fileUrl } = await import('../../src/api/core/files');

    expect(fileUrl('abc')).toBe('https://appwrite.test/v1/storage/buckets/bucket/files/abc/view?project=project');
    expect(fileUrl(null)).toBeNull();
});
