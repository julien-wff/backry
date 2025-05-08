import type { storages } from '$lib/db/schema';
import { getStorage } from '$lib/queries/storages';
import { getRepositoryLocks, unlockRepository } from '$lib/storages/restic';
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
    const locks = await getRepositoryLocks(storage.url, storage.password!, storage.env);

    if (locks.isErr()) {
        return json({ error: locks.error }, { status: 500 });
    }

    return json({ locks: locks.value }, { status: 200 });
};

export const DELETE: RequestHandler = async ({ params }) => {
    const storage = await getStorageFromDb(params.id);
    const res = await unlockRepository(storage.url, storage.password!, storage.env);
    if (res.isErr()) {
        return json({ error: res.error }, { status: 500 });
    }

    return json({ message: 'Repository unlocked successfully' }, { status: 200 });
};
