import { getStorage } from '$lib/queries/storages';
import { parseIdOrNewParam } from '$lib/utils/params';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { id, isNew } = parseIdOrNewParam(params.id);
    if (id === null && !isNew) {
        return error(400, 'Invalid storage ID');
    }

    let storage: Awaited<ReturnType<typeof getStorage>> | null = null;
    if (id !== null) {
        storage = getStorage(id);
        if (!storage) {
            return error(404, 'Storage not found');
        }
    }

    return {
        storage,
    };
};
