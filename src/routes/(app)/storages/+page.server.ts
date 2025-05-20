import { storagesList } from '$lib/server/queries/storages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const storages = await storagesList();

    return {
        storages,
    };
};
