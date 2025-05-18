import type { storages } from '$lib/db/schema';
import { getStorage } from '$lib/queries/storages';
import { apiError } from '$lib/utils/responses';
import { err, ok, type ResultAsync } from 'neverthrow';

/**
 * Get Storage in db from request
 * @param rawId Storage ID from request params
 * @return Storage or error response
 */
export async function getStorageFromRequest(rawId: string | undefined): Promise<ResultAsync<typeof storages.$inferSelect, Response>> {
    const id = parseInt(rawId ?? '');
    if (isNaN(id) || id < 0) {
        return err(apiError('Invalid job ID', 400));
    }

    const storage = getStorage(id);
    if (!storage) {
        throw err(apiError('Storage not found', 404));
    }

    return ok(storage);
}
