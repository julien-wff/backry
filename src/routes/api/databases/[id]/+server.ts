import { deleteDatabase } from '$lib/queries/databases';
import { json, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const databaseId = parseInt(params.id || '');
    if (isNaN(databaseId) || databaseId < 0) {
        return json({ error: 'Invalid database ID' }, { status: 400 });
    }

    // Delete from database
    const deletedDatabase = deleteDatabase(databaseId);
    if (!deletedDatabase) {
        return json({ error: 'Database not found' }, { status: 404 });
    }

    return json(deletedDatabase);
};
