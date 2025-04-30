import { deleteStorage } from '$lib/queries/storages';
import { json, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const storageId = parseInt(params.id || '');
    if (isNaN(storageId) || storageId < 0) {
        return json({ error: 'Invalid storage ID' }, { status: 400 });
    }

    // Delete from database
    const deletedStorage = deleteStorage(storageId);
    if (!deletedStorage) {
        return json({ error: 'Storage not found' }, { status: 404 });
    }

    return json(deletedStorage);
};
