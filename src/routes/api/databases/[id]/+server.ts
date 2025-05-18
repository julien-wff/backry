import { deleteDatabase } from '$lib/queries/databases';
import type { DatabaseResponse } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import { type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const databaseId = parseInt(params.id || '');
    if (isNaN(databaseId) || databaseId < 0) {
        return apiError('Invalid database ID');
    }

    // Delete from database
    const deletedDatabase = deleteDatabase(databaseId);
    if (!deletedDatabase) {
        return apiError('Database not found', 404);
    }

    return apiSuccess<DatabaseResponse>(deletedDatabase);
};
