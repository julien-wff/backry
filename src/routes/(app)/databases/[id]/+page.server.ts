import { parseIdOrNewParam } from '$lib/server/api/params';
import { getDatabase } from '$lib/server/queries/databases';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { id, isNew } = parseIdOrNewParam(params.id);
    if (id === null && !isNew) {
        return error(400, 'Invalid database ID');
    }

    let database: Awaited<ReturnType<typeof getDatabase>> | null = null;
    if (id !== null) {
        database = await getDatabase(id);
        if (!database) {
            return error(404, 'Database not found');
        }
    }

    return {
        database,
    };
};
