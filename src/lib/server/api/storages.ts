import { apiError } from '$lib/server/api/responses';
import type { storages } from '$lib/server/db/schema';
import { getStorage } from '$lib/server/queries/storages';
import { err, ok, type Result } from 'neverthrow';

/**
 * Get Storage in db from request
 * @param rawId Storage ID from request params
 * @return Storage or error response
 */
export async function getStorageFromRequest(rawId: string | undefined): Promise<Result<typeof storages.$inferSelect, Response>> {
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
