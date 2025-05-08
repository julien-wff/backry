import { getStorage } from '$lib/queries/storages';
import { unlockRepository } from '$lib/storages/restic';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params }) => {
    const storageId = parseInt(params.id || '');
    if (isNaN(storageId) || storageId < 0) {
        return json({ error: 'Invalid storage ID' }, { status: 400 });
    }

    const storage = getStorage(storageId);
    if (!storage) {
        return json({ error: 'Storage not found' }, { status: 404 });
    }

    const res = await unlockRepository(storage.url, storage.password!, storage.env);
    if (res.isErr()) {
        return json({ error: res.error }, { status: 500 });
    }

    return json({ message: 'Repository unlocked successfully' }, { status: 200 });
};
