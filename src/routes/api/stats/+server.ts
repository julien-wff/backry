import { getApiStats } from '$lib/server/queries/shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    const stats = await getApiStats();
    return json(stats);
};
