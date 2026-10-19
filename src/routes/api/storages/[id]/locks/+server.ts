import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { getStorageFromRequest } from '#lib/server/api/storages.ts';
import type { StorageLocksResponse } from '#lib/server/schemas/api.ts';
import { getRepositoryLocks, unlockRepository } from '#lib/server/services/restic.ts';
import type { RequestHandler } from './$types';

/**
 * Get locks from repository
 */
export const GET: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const locks = await getRepositoryLocks(
        storage.value.url,
        storage.value.password!,
        storage.value.env,
    );
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

    const res = await unlockRepository(
        storage.value.url,
        storage.value.password!,
        storage.value.env,
    );
    if (res.isErr()) {
        return apiError(res.error.message, 500);
    }

    return apiSuccess({});
};
