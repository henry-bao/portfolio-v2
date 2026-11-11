import { ID, Query } from 'appwrite';
import { z } from 'zod';
import { getBackend } from './client';
import type { BackendConfig } from './env';
import { ApiError, toApiError, withApiErrors } from './errors';

/** Metadata Appwrite adds to every row. */
const rowMetaShape = {
    $id: z.string(),
    $createdAt: z.string(),
    $updatedAt: z.string(),
    $permissions: z.array(z.string()).default([]),
};

export type RowMeta = z.infer<z.ZodObject<typeof rowMetaShape>>;

/** Rows per request when reading a whole table. Appwrite's default page is only 25. */
const PAGE_SIZE = 100;
/** Hard stop for `listAll`, so a bad cursor can never loop forever. */
const MAX_PAGES = 100;

type TableKey = keyof BackendConfig['tables'];

/** Drops `undefined` values so they never reach Appwrite (where an update would treat them as unset). */
const definedValues = (data: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

export interface WriteOptions {
    /** Row-level permissions. Only enforced when the table has row security enabled. */
    permissions?: string[];
}

export interface UpdateOptions<Values> extends WriteOptions {
    /**
     * Column values the caller last saw. If any of them changed since (another tab, another device),
     * the update is refused with a `conflict` error instead of silently overwriting that work.
     *
     * This compares values rather than `$updatedAt` on purpose: counters such as a post's view count
     * bump `$updatedAt` constantly without touching anything an editor cares about.
     */
    expected?: Values;
}

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * A typed, validated handle on one Appwrite table, described by the Zod schemas of its `columns`.
 *
 * - Every row read is parsed with those schemas, so callers get real types instead of casts. A malformed
 *   row in a list is logged and skipped; a malformed row fetched by id throws `invalid_data`.
 * - Every failure is an `ApiError` (see errors.ts).
 * - Writes take plain column values. `undefined` values are left out of the request (so an update
 *   leaves those columns untouched) and `null` clears a column.
 */
export function defineTable<Shape extends z.ZodRawShape>(name: string, tableKey: TableKey, columns: Shape) {
    const rowSchema = z.object({ ...columns, ...rowMetaShape });

    type Columns = z.output<z.ZodObject<Shape>>;
    type Row = z.output<typeof rowSchema>;
    type Values = { [Key in keyof Columns]?: Columns[Key] | null };

    const location = () => {
        const { config, tablesDB } = getBackend();
        return { tablesDB, databaseId: config.databaseId, tableId: config.tables[tableKey] };
    };

    const parseRow = (raw: unknown): Row => {
        const result = rowSchema.safeParse(raw);

        if (!result.success) {
            const id = (raw as { $id?: string } | null)?.$id ?? 'unknown';
            throw new ApiError('invalid_data', `${name} row ${id} is malformed: ${z.prettifyError(result.error)}`, {
                cause: result.error,
            });
        }

        return result.data;
    };

    const parseRows = (raws: unknown[]): Row[] =>
        raws.flatMap((raw) => {
            try {
                return [parseRow(raw)];
            } catch (error) {
                // One bad row shouldn't blank the whole list.
                console.error(error);
                return [];
            }
        });

    const list = (queries: string[] = [], { limit = PAGE_SIZE }: { limit?: number } = {}) =>
        withApiErrors(`List ${name}`, async () => {
            const { tablesDB, databaseId, tableId } = location();
            const result = await tablesDB.listRows({
                databaseId,
                tableId,
                queries: [...queries, Query.limit(limit)],
                total: false,
            });

            return parseRows(result.rows);
        });

    /** Every matching row, fetched page by page. `queries` must not contain limit or cursor queries. */
    const listAll = (queries: string[] = []) =>
        withApiErrors(`List all ${name}`, async () => {
            const { tablesDB, databaseId, tableId } = location();
            const rows: unknown[] = [];
            let cursor: string | undefined;

            for (let page = 0; page < MAX_PAGES; page += 1) {
                const result = await tablesDB.listRows({
                    databaseId,
                    tableId,
                    queries: [...queries, Query.limit(PAGE_SIZE), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
                    total: false,
                });

                rows.push(...result.rows);

                if (result.rows.length < PAGE_SIZE) {
                    return parseRows(rows);
                }

                cursor = result.rows[result.rows.length - 1].$id;
            }

            throw new ApiError('unknown', `${name} has more than ${PAGE_SIZE * MAX_PAGES} rows`);
        });

    const first = async (queries: string[] = []): Promise<Row | null> => (await list(queries, { limit: 1 }))[0] ?? null;

    /** Throws `not_found` when the row doesn't exist. */
    const get = (rowId: string) =>
        withApiErrors(`Get ${name} ${rowId}`, async () => {
            const { tablesDB, databaseId, tableId } = location();
            return parseRow(await tablesDB.getRow({ databaseId, tableId, rowId }));
        });

    /** Like `get`, but `null` when the row doesn't exist. */
    const find = async (rowId: string): Promise<Row | null> => {
        try {
            return await get(rowId);
        } catch (error) {
            if (toApiError(error).kind === 'not_found') {
                return null;
            }
            throw error;
        }
    };

    const create = (data: Values, { permissions, rowId = ID.unique() }: WriteOptions & { rowId?: string } = {}) =>
        withApiErrors(`Create ${name}`, async () => {
            const { tablesDB, databaseId, tableId } = location();
            return parseRow(
                await tablesDB.createRow({ databaseId, tableId, rowId, data: definedValues(data), permissions })
            );
        });

    const update = (rowId: string, data: Values, { permissions, expected }: UpdateOptions<Values> = {}) =>
        withApiErrors(`Update ${name} ${rowId}`, async () => {
            const { tablesDB, databaseId, tableId } = location();

            if (expected) {
                const current = parseRow(await tablesDB.getRow({ databaseId, tableId, rowId })) as Record<string, unknown>;
                const changed = Object.entries(expected).some(([key, value]) => !sameValue(current[key], value));

                if (changed) {
                    throw new ApiError(
                        'conflict',
                        `This ${name} was changed somewhere else after you opened it. Reload to get the latest version, then reapply your edits.`
                    );
                }
            }

            return parseRow(
                await tablesDB.updateRow({ databaseId, tableId, rowId, data: definedValues(data), permissions })
            );
        });

    /** Deleting a row that's already gone counts as success. */
    const remove = (rowId: string) =>
        withApiErrors(`Delete ${name} ${rowId}`, async () => {
            const { tablesDB, databaseId, tableId } = location();

            try {
                await tablesDB.deleteRow({ databaseId, tableId, rowId });
            } catch (error) {
                if (toApiError(error).kind !== 'not_found') {
                    throw error;
                }
            }
        });

    /**
     * Staged writes for `runTransaction` (see transactions.ts). Nothing is visible until the
     * transaction commits, so these return nothing; read the rows again afterwards if needed.
     */
    const stage = {
        create: (transactionId: string, data: Values, { permissions, rowId = ID.unique() }: WriteOptions & { rowId?: string } = {}) =>
            withApiErrors(`Stage create ${name}`, async () => {
                const { tablesDB, databaseId, tableId } = location();
                await tablesDB.createRow({ databaseId, tableId, rowId, data: definedValues(data), permissions, transactionId });
            }),

        update: (transactionId: string, rowId: string, data: Values, { permissions }: WriteOptions = {}) =>
            withApiErrors(`Stage update ${name} ${rowId}`, async () => {
                const { tablesDB, databaseId, tableId } = location();
                await tablesDB.updateRow({ databaseId, tableId, rowId, data: definedValues(data), permissions, transactionId });
            }),

        remove: (transactionId: string, rowId: string) =>
            withApiErrors(`Stage delete ${name} ${rowId}`, async () => {
                const { tablesDB, databaseId, tableId } = location();
                await tablesDB.deleteRow({ databaseId, tableId, rowId, transactionId });
            }),
    };

    return { name, rowSchema, list, listAll, first, get, find, create, update, remove, stage };
}

export type TableRow<Table extends { rowSchema: z.ZodType }> = z.output<Table['rowSchema']>;
