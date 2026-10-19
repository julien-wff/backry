import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { deleteDatabase, updateDatabase } from '#lib/server/queries/databases.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { databaseRequest, type DatabaseResponse } from '#lib/server/schemas/api.ts';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
    const databaseId = parseInt(params.id);
    if (isNaN(databaseId) || databaseId < 0) {
        return apiError('Invalid database ID');
    }

    const body = await parseRequestBody(request, databaseRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const updatedDatabase = updateDatabase(databaseId, body.value);
    if (!updatedDatabase) {
        return apiError('Database not found', 404);
    }

    return apiSuccess<DatabaseResponse>(updatedDatabase);
};

export const DELETE: RequestHandler = async ({ params }) => {
    const databaseId = parseInt(params.id);
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
