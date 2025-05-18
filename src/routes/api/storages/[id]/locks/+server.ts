import type { StorageLocksResponse } from '$lib/schemas/api';
import { getStorageFromRequest } from '$lib/storages/api';
import { getRepositoryLocks, unlockRepository } from '$lib/storages/restic';
import { apiError, apiSuccess } from '$lib/utils/responses';
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

    return apiSuccess({});
};
