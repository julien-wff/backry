import { activeDatabasesListShort } from '$lib/queries/databases';
import { activeStoragesListShort } from '$lib/queries/storages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const [ databases, storages ] = await Promise.all([
        activeDatabasesListShort(),
        activeStoragesListShort(),
    ]);

    return {
        databases,
        storages,
    };
};
