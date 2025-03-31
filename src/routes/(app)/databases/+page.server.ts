import { databasesList } from '$lib/queries/databases';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const databases = await databasesList();

    return {
        databases,
    };
};
