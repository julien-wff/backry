import { apiError, apiSuccess } from '$lib/server/api/responses';
import { getStorageFromRequest } from '$lib/server/api/storages';
import type { StorageLocksResponse } from '$lib/server/schemas/api';
import { getRepositoryLocks, unlockRepository } from '$lib/server/services/restic';
import { updateStorageHealth } from '$lib/server/storages/health';
import { type RequestHandler } from '@sveltejs/kit';

/**
 * Get locks from repository
 */
export const GET: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const locks = await getRepositoryLocks(storage.value.url, storage.value.password!, storage.value.env);
    if (locks.isErr()) {
        return apiError(locks.error, 500);
    }

    return apiSuccess<StorageLocksResponse>({ locks: locks.value });
};

/**
 * Remove all locks from repository
 */
export const DELETE: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const res = await unlockRepository(storage.value.url, storage.value.password!, storage.value.env);
    if (res.isErr()) {
        return apiError(res.error.message, 500);
    }

    // Queue health update
    void updateStorageHealth(storage.value);

    return apiSuccess({});
};
