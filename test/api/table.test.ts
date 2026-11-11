import { beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { z } from 'zod';
import { fakeAppwrite, resetFakeAppwrite } from '../fakeBackend';
import { defineTable } from '../../src/api/core/table';
import { runTransaction } from '../../src/api/core/transactions';
import { isApiError } from '../../src/api/core/errors';

const projects = defineTable('project', 'projects', { title: z.string(), order: z.number().nullish() });

beforeEach(() => {
    resetFakeAppwrite();
});

describe('defineTable', () => {
    test('listAll follows cursors past the page size', async () => {
        fakeAppwrite().seed(
            'projects',
            Array.from({ length: 250 }, (_, index) => ({ $id: `p${String(index).padStart(3, '0')}`, title: `P${index}` }))
        );

        const rows = await projects.listAll([]);

        expect(rows).toHaveLength(250);
        expect(new Set(rows.map((row) => row.$id)).size).toBe(250);
    });

    test('a malformed row is skipped in lists but rejected when fetched directly', async () => {
        const consoleError = spyOn(console, 'error').mockImplementation(() => {});
        fakeAppwrite().seed('projects', [
            { $id: 'good', title: 'Good' },
            { $id: 'bad', title: 42 },
        ]);

        expect((await projects.listAll()).map((row) => row.$id)).toEqual(['good']);
        expect(consoleError).toHaveBeenCalled();

        const error = await projects.get('bad').catch((caught: unknown) => caught);
        expect(isApiError(error, 'invalid_data')).toBe(true);
        consoleError.mockRestore();
    });

    test('find returns null for a missing row; get throws not_found', async () => {
        expect(await projects.find('missing')).toBeNull();
        expect(isApiError(await projects.get('missing').catch((caught: unknown) => caught), 'not_found')).toBe(true);
    });

    test('update refuses to overwrite values that changed since they were loaded', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'p1', title: 'Original' }]);
        const loaded = await projects.get('p1');

        await projects.update('p1', { title: 'Edited elsewhere' });

        const error = await projects
            .update('p1', { title: 'Mine' }, { expected: { title: loaded.title } })
            .catch((caught: unknown) => caught);

        expect(isApiError(error, 'conflict')).toBe(true);
        expect((await projects.get('p1')).title).toBe('Edited elsewhere');
    });

    test('update ignores changes to columns the caller did not load', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'p1', title: 'Original', order: 0 }]);

        await projects.update('p1', { order: 5 });
        const saved = await projects.update('p1', { title: 'Mine' }, { expected: { title: 'Original' } });

        expect(saved.title).toBe('Mine');
    });

    test('undefined values are left out, null clears a column', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'p1', title: 'Keep', order: 3 }]);

        const saved = await projects.update('p1', { title: undefined, order: null });

        expect(saved.title).toBe('Keep');
        expect(saved.order).toBeNull();
    });

    test('remove is idempotent', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'p1', title: 'Gone soon' }]);

        await projects.remove('p1');
        await projects.remove('p1');

        expect(fakeAppwrite().rows('projects')).toHaveLength(0);
    });
});

describe('runTransaction', () => {
    test('applies staged writes together', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'a', title: 'A', order: 0 }, { $id: 'b', title: 'B', order: 1 }]);

        await runTransaction('Swap', async (transactionId) => {
            await projects.stage.update(transactionId, 'a', { order: 1 });
            await projects.stage.update(transactionId, 'b', { order: 0 });
        });

        expect(fakeAppwrite().rows('projects').map((row) => [row.$id, row.order])).toEqual([
            ['a', 1],
            ['b', 0],
        ]);
    });

    test('applies nothing when the commit fails', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'a', title: 'A', order: 0 }]);
        fakeAppwrite().failNextCommit();

        const error = await runTransaction('Fails', async (transactionId) => {
            await projects.stage.update(transactionId, 'a', { order: 9 });
        }).catch((caught: unknown) => caught);

        expect(isApiError(error)).toBe(true);
        expect(fakeAppwrite().rows('projects')[0].order).toBe(0);
    });

    test('rolls back when staging throws', async () => {
        fakeAppwrite().seed('projects', [{ $id: 'a', title: 'A', order: 0 }]);

        await runTransaction('Throws', async (transactionId) => {
            await projects.stage.update(transactionId, 'a', { order: 9 });
            throw new Error('changed my mind');
        }).catch(() => {});

        expect(fakeAppwrite().rows('projects')[0].order).toBe(0);
    });
});
