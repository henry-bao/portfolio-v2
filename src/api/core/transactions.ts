import { getBackend } from './client';
import { toApiError } from './errors';

/** Long enough to stage a handful of writes; an abandoned transaction expires on its own after this. */
const TRANSACTION_TTL_SECONDS = 60;

/**
 * Runs `stageWrites` inside one TablesDB transaction and commits it, so its writes land together or
 * not at all. If staging or the commit fails, the transaction is rolled back and the error rethrown.
 *
 * Use the tables' `stage.*` methods inside `stageWrites`. Reads inside it are not part of the
 * transaction; do them first.
 */
export async function runTransaction(label: string, stageWrites: (transactionId: string) => Promise<void>) {
    const { tablesDB } = getBackend();
    let transactionId: string | null = null;

    try {
        transactionId = (await tablesDB.createTransaction({ ttl: TRANSACTION_TTL_SECONDS })).$id;
        await stageWrites(transactionId);
        await tablesDB.updateTransaction({ transactionId, commit: true });
    } catch (error) {
        if (transactionId) {
            try {
                await tablesDB.updateTransaction({ transactionId, rollback: true });
            } catch (rollbackError) {
                // It expires on its own after the TTL; nothing was committed either way.
                console.error(`Couldn't roll back transaction ${transactionId}:`, rollbackError);
            }
        }

        throw toApiError(error, label);
    }
}
