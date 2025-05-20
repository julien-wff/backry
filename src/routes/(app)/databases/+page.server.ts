import { DATABASE_ENGINES } from '$lib/server/db/schema';
import { databasesListFiltered } from '$lib/server/queries/databases';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const databases = await databasesListFiltered(
        url.searchParams.get('engines')
            ?.split(',')
            ?.filter(engine => DATABASE_ENGINES.includes(engine as typeof DATABASE_ENGINES[number])) as typeof DATABASE_ENGINES[number][]
        ?? DATABASE_ENGINES,
    );

    return {
        databases,
    };
};
