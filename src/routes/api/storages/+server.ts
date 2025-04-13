import { createStorage } from '$lib/queries/databases';
import type { StoragesCreateRequest } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as StoragesCreateRequest;
    const result = createStorage(body);
    return json(result, { status: 201 });
};
