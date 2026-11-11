import { AppwriteException } from 'appwrite';

/**
 * An in-memory stand-in for the Appwrite services the data layer uses: TablesDB (with queries and
 * transactions), Storage, Functions and Account. Just enough behaviour to test our logic; it is
 * not a full emulation of Appwrite.
 *
 * Install it with `mock.module` on src/api/core/client before importing the module under test.
 */

type Row = Record<string, unknown> & { $id: string; $createdAt: string; $updatedAt: string; $permissions: string[] };
type Query = { method: string; attribute?: string; values?: unknown[] };
type StagedWrite =
    | { action: 'create'; tableId: string; rowId: string; data: Record<string, unknown>; permissions?: string[] }
    | { action: 'update'; tableId: string; rowId: string; data: Record<string, unknown>; permissions?: string[] }
    | { action: 'delete'; tableId: string; rowId: string };

const notFound = (what: string) => new AppwriteException(`${what} not found`, 404, 'row_not_found');

let clock = Date.parse('2026-01-01T00:00:00.000Z');
const tick = () => new Date((clock += 1000)).toISOString();

export function createFakeAppwrite({ uniqueColumns = {} }: { uniqueColumns?: Record<string, string[]> } = {}) {
    const tables = new Map<string, Map<string, Row>>();
    const transactions = new Map<string, StagedWrite[]>();
    const files = new Map<string, Record<string, unknown>>();
    const executions: Array<{ functionId: string; body?: string; async?: boolean }> = [];
    let idCounter = 0;
    let failNextCommit = false;

    const table = (tableId: string) => {
        if (!tables.has(tableId)) tables.set(tableId, new Map());
        return tables.get(tableId) as Map<string, Row>;
    };

    const assertUnique = (tableId: string, candidate: Record<string, unknown>, rowId: string) => {
        for (const column of uniqueColumns[tableId] ?? []) {
            for (const row of table(tableId).values()) {
                if (row.$id !== rowId && candidate[column] !== undefined && row[column] === candidate[column]) {
                    throw new AppwriteException('Document with the requested unique value already exists', 409, 'row_already_exists');
                }
            }
        }
    };

    const applyCreate = (tableId: string, rowId: string, data: Record<string, unknown>, permissions: string[] = []) => {
        if (table(tableId).has(rowId)) {
            throw new AppwriteException('Row already exists', 409, 'row_already_exists');
        }
        assertUnique(tableId, data, rowId);
        const now = tick();
        const row: Row = { ...data, $id: rowId, $createdAt: now, $updatedAt: now, $permissions: permissions };
        table(tableId).set(rowId, row);
        return row;
    };

    const applyUpdate = (tableId: string, rowId: string, data: Record<string, unknown>, permissions?: string[]) => {
        const existing = table(tableId).get(rowId);
        if (!existing) throw notFound(`Row ${rowId}`);
        assertUnique(tableId, { ...existing, ...data }, rowId);
        const row: Row = { ...existing, ...data, $updatedAt: tick(), $permissions: permissions ?? existing.$permissions };
        table(tableId).set(rowId, row);
        return row;
    };

    const matches = (row: Row, query: Query) => {
        const value = row[query.attribute as string];
        if (query.method === 'equal') return (query.values ?? []).some((candidate) => candidate === value);
        if (query.method === 'notEqual') return value !== query.values?.[0];
        return true;
    };

    const runQueries = (rows: Row[], rawQueries: string[] = []) => {
        const queries = rawQueries.map((raw) => JSON.parse(raw) as Query);
        let result = rows.filter((row) => queries.every((query) => matches(row, query)));

        for (const query of queries) {
            if (query.method === 'orderAsc' || query.method === 'orderDesc') {
                const direction = query.method === 'orderAsc' ? 1 : -1;
                const key = query.attribute as string;
                result = [...result].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * direction);
            }
        }

        const cursor = queries.find((query) => query.method === 'cursorAfter')?.values?.[0];
        if (cursor) result = result.slice(result.findIndex((row) => row.$id === cursor) + 1);

        const offset = queries.find((query) => query.method === 'offset')?.values?.[0] as number | undefined;
        if (offset) result = result.slice(offset);

        const limit = queries.find((query) => query.method === 'limit')?.values?.[0] as number | undefined;
        return result.slice(0, limit ?? 25);
    };

    const stage = (transactionId: string, write: StagedWrite) => {
        const staged = transactions.get(transactionId);
        if (!staged) throw new AppwriteException('Transaction not found', 404, 'transaction_not_found');
        staged.push(write);
    };

    const tablesDB = {
        listRows: async ({ tableId, queries }: { tableId: string; queries?: string[] }) => {
            const rows = runQueries([...table(tableId).values()], queries);
            return { total: rows.length, rows: structuredClone(rows) };
        },
        getRow: async ({ tableId, rowId }: { tableId: string; rowId: string }) => {
            const row = table(tableId).get(rowId);
            if (!row) throw notFound(`Row ${rowId}`);
            return structuredClone(row);
        },
        createRow: async ({ tableId, rowId, data, permissions, transactionId }: { tableId: string; rowId: string; data: Record<string, unknown>; permissions?: string[]; transactionId?: string }) => {
            const id = rowId === 'unique()' ? `row-${++idCounter}` : rowId;
            if (transactionId) return stage(transactionId, { action: 'create', tableId, rowId: id, data, permissions });
            return structuredClone(applyCreate(tableId, id, data, permissions));
        },
        updateRow: async ({ tableId, rowId, data, permissions, transactionId }: { tableId: string; rowId: string; data: Record<string, unknown>; permissions?: string[]; transactionId?: string }) => {
            if (transactionId) return stage(transactionId, { action: 'update', tableId, rowId, data, permissions });
            return structuredClone(applyUpdate(tableId, rowId, data, permissions));
        },
        deleteRow: async ({ tableId, rowId, transactionId }: { tableId: string; rowId: string; transactionId?: string }) => {
            if (transactionId) return stage(transactionId, { action: 'delete', tableId, rowId });
            if (!table(tableId).delete(rowId)) throw notFound(`Row ${rowId}`);
        },
        createTransaction: async () => {
            const $id = `tx-${++idCounter}`;
            transactions.set($id, []);
            return { $id };
        },
        updateTransaction: async ({ transactionId, commit, rollback }: { transactionId: string; commit?: boolean; rollback?: boolean }) => {
            const staged = transactions.get(transactionId);
            if (!staged) throw new AppwriteException('Transaction not found', 404, 'transaction_not_found');

            if (rollback) {
                transactions.delete(transactionId);
                return { status: 'rolledBack' };
            }

            if (commit) {
                if (failNextCommit) {
                    // Like Appwrite, a failed commit leaves the transaction open for a rollback.
                    failNextCommit = false;
                    throw new AppwriteException('Commit failed', 500, 'general_server_error');
                }

                transactions.delete(transactionId);

                // All or nothing: apply to a copy, swap it in only if every write succeeds.
                const snapshot = new Map([...tables].map(([id, rows]) => [id, new Map(rows)]));
                try {
                    for (const write of staged) {
                        if (write.action === 'create') applyCreate(write.tableId, write.rowId, write.data, write.permissions);
                        if (write.action === 'update') applyUpdate(write.tableId, write.rowId, write.data, write.permissions);
                        if (write.action === 'delete' && !table(write.tableId).delete(write.rowId)) throw notFound(`Row ${write.rowId}`);
                    }
                } catch (error) {
                    tables.clear();
                    snapshot.forEach((rows, id) => tables.set(id, rows));
                    throw error;
                }
            }

            return { status: 'committed' };
        },
    };

    const storage = {
        createFile: async ({ fileId, file, folder }: { fileId: string; file: File; folder?: string }) => {
            const id = fileId === 'unique()' ? `file-${++idCounter}` : fileId;
            if (files.has(id)) throw new AppwriteException('File already exists', 409, 'storage_file_already_exists');
            const now = tick();
            const stored = { $id: id, $createdAt: now, $updatedAt: now, name: file.name, mimeType: file.type, sizeOriginal: file.size, folder: folder ? `${folder}/` : '' };
            files.set(id, stored);
            return structuredClone(stored);
        },
        getFile: async ({ fileId }: { fileId: string }) => {
            const stored = files.get(fileId);
            if (!stored) throw new AppwriteException('File not found', 404, 'storage_file_not_found');
            return structuredClone(stored);
        },
        deleteFile: async ({ fileId }: { fileId: string }) => {
            if (!files.delete(fileId)) throw new AppwriteException('File not found', 404, 'storage_file_not_found');
        },
        listFiles: async ({ queries }: { queries?: string[] }) => ({
            files: runQueries([...files.values()] as Row[], queries),
        }),
    };

    const functions = {
        createExecution: async (params: { functionId: string; body?: string; async?: boolean }) => {
            executions.push(params);
            return { $id: `exec-${executions.length}` };
        },
    };

    const config = {
        endpoint: 'https://appwrite.test/v1',
        projectId: 'project',
        databaseId: 'db',
        bucketId: 'bucket',
        tables: { profile: 'profile', projects: 'projects', blogPosts: 'blogs', siteSettings: 'settings', resumes: 'resumes' },
        functions: { recordBlogView: 'record-blog-view' },
    };

    return {
        backend: { config, tablesDB, storage, functions, account: {} as Record<string, unknown> },
        /** Rows of a table as currently stored. */
        rows: (tableId: string) => [...table(tableId).values()],
        seed: (tableId: string, rows: Array<Record<string, unknown> & { $id: string; $permissions?: string[] }>) =>
            rows.forEach(({ $id, $permissions = [], ...data }) => applyCreate(tableId, $id, data, $permissions)),
        files,
        executions,
        failNextCommit: () => {
            failNextCommit = true;
        },
    };
}

export type FakeAppwrite = ReturnType<typeof createFakeAppwrite>;
