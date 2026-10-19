import { parseIdOrNewParam } from '#lib/server/api/params.ts';
import { getStorage } from '#lib/server/queries/storages.ts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { id, isNew } = parseIdOrNewParam(params.id);
    if (id === null || isNew) {
        return error(400, 'Invalid storage ID');
    }

    const storage = getStorage(id);
    if (!storage) {
        throw error(404, 'Storage not found');
    }

    return {
        storage,
    };
};
