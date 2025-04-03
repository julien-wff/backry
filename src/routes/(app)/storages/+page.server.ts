import { storagesList } from '$lib/queries/databases';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const storages = await storagesList();

    return {
        storages,
    };
};
