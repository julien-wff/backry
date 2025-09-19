import type { PageServerLoad } from './$types';
import { parseIdOrNewParam } from '$lib/server/api/params';
import { error } from '@sveltejs/kit';
import { getRestoreFull } from '$lib/server/queries/restores';

export const load: PageServerLoad = async ({ params }) => {
    const { id } = parseIdOrNewParam(params.id);
    if (id === null) {
        return error(400, 'Invalid restore ID');
    }

    const restore = await getRestoreFull(id);
    if (!restore) {
        return error(404, 'Restore not found');
    }

    return {
        restore,
    };
};
