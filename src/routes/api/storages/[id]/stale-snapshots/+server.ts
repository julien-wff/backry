import { apiError, apiSuccess } from '$lib/server/api/responses';
import { getStorageFromRequest } from '$lib/server/api/storages';
import { getSnapshotsIdsByStorageId } from '$lib/server/queries/backups';
import { parseRequestBody } from '$lib/server/schemas';
import { storageStaleSnapshotsDeleteRequest, type StorageStaleSnapshotsResponse } from '$lib/server/schemas/api';
import { deleteSnapshots, getRepositorySnapshots } from '$lib/server/services/restic';
import { type RequestHandler } from '@sveltejs/kit';

/**
 * Get 'restic' labelled snapshots that have no corresponding backup in the database
 */
export const GET: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const backupsSnapshotsIds = getSnapshotsIdsByStorageId(storage.value.id);

    const res = await getRepositorySnapshots(
        storage.value.url,
        storage.value.password!,
        storage.value.env,
        true,
    );
    if (res.isErr()) {
        return apiError(res.error.message, 500);
    }

    if (res.value.length === 0 || !Array.isArray(res.value[0])) {
        return apiSuccess<StorageStaleSnapshotsResponse>({ snapshots: [] });
    }

    return apiSuccess<StorageStaleSnapshotsResponse>({
        snapshots: res.value[0].filter(snapshot => !backupsSnapshotsIds.includes(snapshot.id)),
    });
};

/**
 * Delete snapshots from repository without deleting them from the database (because they are not supposed to be there)
 */
export const DELETE: RequestHandler = async ({ request, params }) => {
    const storage = await getStorageFromRequest(params.id);
    if (storage.isErr()) {
        return storage.error;
    }

    const body = await parseRequestBody(request, storageStaleSnapshotsDeleteRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const res = await deleteSnapshots(
        storage.value.url,
        storage.value.password!,
        storage.value.env,
        body.value.snapshots,
    );
    if (res.isErr()) {
        return apiError(res.error.message, 500);
    }

    return apiSuccess({});
};
