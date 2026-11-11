import { beforeEach, describe, expect, test } from 'bun:test';
import { fakeAppwrite, resetFakeAppwrite } from '../fakeBackend';
import { deleteResume, getActiveResume, listResumes, setActiveResume, uploadResume } from '../../src/api/resumes';
import { isApiError } from '../../src/api/core/errors';
import { RESUME_FILE_NAME } from '../../src/config/site';

const PUBLIC_READ = 'read("any")';

const pdf = (name = 'My Resume (final).pdf') => new File(['%PDF-1.7'], name, { type: 'application/pdf' });

const activeRows = () => fakeAppwrite().rows('resumes').filter((row) => row.isActive === true);

/** The invariant every resume operation must keep. */
const expectExactlyOneActive = (rowId?: string) => {
    const active = activeRows();
    expect(active).toHaveLength(1);
    if (rowId) expect(active[0].$id).toBe(rowId);
    // Only the active version is publicly readable.
    for (const row of fakeAppwrite().rows('resumes')) {
        expect(row.$permissions.includes(PUBLIC_READ)).toBe(row.isActive === true);
    }
};

const seedVersions = (count: number, activeIndex: number) =>
    fakeAppwrite().seed(
        'resumes',
        Array.from({ length: count }, (_, index) => ({
            $id: `r${index}`,
            fileId: `file-r${index}`,
            fileName: `v${index}.pdf`,
            uploadDate: `2026-0${index + 1}-01T00:00:00.000Z`,
            isActive: index === activeIndex,
            $permissions: index === activeIndex ? [PUBLIC_READ] : [],
        }))
    );

beforeEach(() => {
    resetFakeAppwrite();
});

describe('uploadResume', () => {
    test('the first upload is always made active, even when not asked', async () => {
        const { isActive } = await uploadResume({ file: pdf(), activate: false });

        expect(isActive).toBe(true);
        expectExactlyOneActive();
    });

    test('stores the file under the canonical name but lists it by its original name', async () => {
        await uploadResume({ file: pdf('cv-draft-7.pdf'), activate: true });

        const [storedFile] = fakeAppwrite().files.values();
        const [row] = await listResumes();

        expect(storedFile.name).toBe(RESUME_FILE_NAME);
        expect(storedFile.folder).toBe('resumes/');
        expect(row.fileName).toBe('cv-draft-7.pdf');
    });

    test('activating a new upload deactivates the previous version in the same transaction', async () => {
        seedVersions(2, 0);

        const { rowId } = await uploadResume({ file: pdf(), activate: true });

        expectExactlyOneActive(rowId);
    });

    test('an inactive upload leaves the current public resume alone', async () => {
        seedVersions(1, 0);

        await uploadResume({ file: pdf(), activate: false });

        expect(activeRows().map((row) => row.$id)).toEqual(['r0']);
    });

    test('rejects non-PDFs before uploading anything', async () => {
        const error = await uploadResume({
            file: new File(['x'], 'resume.docx', { type: 'application/msword' }),
            activate: true,
        }).catch((caught: unknown) => caught);

        expect(isApiError(error, 'invalid_input')).toBe(true);
        expect(fakeAppwrite().files.size).toBe(0);
    });

    test('a failed transaction deletes the uploaded file and changes nothing', async () => {
        seedVersions(1, 0);
        fakeAppwrite().failNextCommit();

        await uploadResume({ file: pdf(), activate: true }).catch(() => {});

        expect(fakeAppwrite().files.size).toBe(0);
        expect(fakeAppwrite().rows('resumes')).toHaveLength(1);
        expect(activeRows().map((row) => row.$id)).toEqual(['r0']);
    });
});

describe('setActiveResume', () => {
    test('switches the active version atomically', async () => {
        seedVersions(3, 0);

        await setActiveResume('r2');

        expectExactlyOneActive('r2');
    });

    test('repairs a table that somehow had two active versions', async () => {
        seedVersions(3, 0);
        fakeAppwrite().rows('resumes')[1].isActive = true;

        await setActiveResume('r2');

        expectExactlyOneActive('r2');
    });

    test('a failed commit leaves the previous version active', async () => {
        seedVersions(2, 0);
        fakeAppwrite().failNextCommit();

        await setActiveResume('r1').catch(() => {});

        expect(activeRows().map((row) => row.$id)).toEqual(['r0']);
    });
});

describe('deleteResume', () => {
    test('deleting the active version promotes the newest remaining one', async () => {
        seedVersions(3, 1);
        const [, active] = await listResumes().then((rows) => rows.sort((a, b) => a.$id.localeCompare(b.$id)));

        await deleteResume(active);

        expectExactlyOneActive('r2');
        expect(fakeAppwrite().rows('resumes').map((row) => row.$id)).not.toContain('r1');
    });

    test('deleting an inactive version leaves the active one alone', async () => {
        seedVersions(2, 1);
        const inactive = (await listResumes()).find((row) => row.$id === 'r0');

        await deleteResume(inactive!);

        expectExactlyOneActive('r1');
    });

    test('deleting the last version leaves no active resume (and /resume 404s)', async () => {
        seedVersions(1, 0);
        const [only] = await listResumes();

        await deleteResume(only);

        expect(await getActiveResume()).toBeNull();
    });

    test('uses the current state, not a stale copy that thinks it is inactive', async () => {
        seedVersions(2, 0);
        const stale = { ...(await listResumes()).find((row) => row.$id === 'r0')!, isActive: false };

        await deleteResume(stale);

        expectExactlyOneActive('r1');
    });

    test('deletes the version file too', async () => {
        await uploadResume({ file: pdf(), activate: true });
        const [row] = await listResumes();

        await deleteResume(row);

        expect(fakeAppwrite().files.size).toBe(0);
    });
});

test('getActiveResume picks the newest when two are active', async () => {
    seedVersions(3, 0);
    fakeAppwrite().rows('resumes')[2].isActive = true;

    expect((await getActiveResume())?.$id).toBe('r2');
});
