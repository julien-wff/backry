import { apiError, apiSuccess } from '$lib/server/api/responses';
import { getStorageFromRequest } from '$lib/server/api/storages';
import { setBackupsToPrunedById } from '$lib/server/queries/backups';
import { parseRequestBody } from '$lib/server/schemas';
import { type StoragePruneDesyncResponse, storagePruneDesyncUpdateRequest } from '$lib/server/schemas/api';
import { logger } from '$lib/server/services/logger';
import { getPruneDesyncBackups } from '$lib/server/storages/health';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Get backups which are marked as 'successful' but their Restic snapshots don't exist anymore in the repository.
 */
export const GET: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const res = await getPruneDesyncBackups(storage.value);
    if (res.isErr()) {
        return apiError(res.error, 500);
    } else {
        return apiSuccess<StoragePruneDesyncResponse>({
            backups: res.value,
        });
    }
};


export const POST: RequestHandler = async ({ request, params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const body = await parseRequestBody(request, storagePruneDesyncUpdateRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const updatedBackups = await setBackupsToPrunedById(body.value.backups);
    if (updatedBackups.length !== body.value.backups.length) {
        logger.error(
            { expected: body.value.backups, updated: updatedBackups.map(b => b.id) },
            `Not all backups were updated to pruned state for storage #${storage.value.id}. Expected: ${body.value.backups.length}, updated: ${updatedBackups.length}`,
        );
        const diff = body.value.backups.length - updatedBackups.length;
        return apiError(
            `${diff} ${diff > 1 ? 'backups were' : 'backup was'} not updated to pruned state`,
            500,
        );
    }

    return apiSuccess({});
};
