import { createDatabase } from '$lib/queries/databases';
import { parseRequestBody } from '$lib/schemas';
import { databaseRequest, type DatabaseResponse } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, databaseRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const database = createDatabase(body.value);
    return apiSuccess<DatabaseResponse>(database, 201);
};
