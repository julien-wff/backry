import type { storages } from '$lib/db/schema';
import { getSnapshotsIdsByStorageId } from '$lib/queries/backups';
import { getStorage } from '$lib/queries/storages';
import { deleteSnapshots, getRepositorySnapshots } from '$lib/storages/restic';
import { parseIdOrNewParam } from '$lib/utils/params';
import { error, json, type RequestHandler } from '@sveltejs/kit';

async function getStorageFromDb(rawId: string | undefined): Promise<typeof storages.$inferSelect> {
    const { id, isNew } = parseIdOrNewParam(rawId ?? '');
    if (id === null || isNew) {
        throw error(400, 'Invalid storage ID');
    }

    const storage = getStorage(id);
    if (!storage) {
        throw error(404, 'Storage not found');
    }

    return storage;
}

export const GET: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromDb(params.id);
    const backupsSnapshotsIds = getSnapshotsIdsByStorageId(storage.id);

    const res = await getRepositorySnapshots(storage.url, storage.password!, storage.env, true);
    if (res.isErr()) {
        return json({ error: res.error.message }, { status: 500 });
    }

    if (res.value.length === 0 || !Array.isArray(res.value[0])) {
        return json({ snapshots: [] });
    }

    return json({
        snapshots: res.value[0].filter(snapshot => !backupsSnapshotsIds.includes(snapshot.id)),
    });
};

export const DELETE: RequestHandler = async ({ request, params }) => {
    const storage = await getStorageFromDb(params.id);
    const { snapshots } = await request.json() as { snapshots: string[] };

    const res = await deleteSnapshots(storage.url, storage.password!, storage.env, snapshots);
    if (res.isErr()) {
        return json({ error: res.error.message }, { status: 500 });
    }

    return json({
        snapshots,
    });
};
