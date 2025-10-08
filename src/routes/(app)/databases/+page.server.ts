import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { DATABASE_ENGINES } from '$lib/server/db/schema';
import { databasesListExtendedFiltered, getDatabasesCountByEngine } from '$lib/server/queries/databases';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const databases = await databasesListExtendedFiltered(
        url.searchParams.get('engines')
            ?.split(',')
            ?.filter(engine => DATABASE_ENGINES.includes(engine as typeof DATABASE_ENGINES[number])) as typeof DATABASE_ENGINES[number][]
        ?? DATABASE_ENGINES,
    );

    const databasesByEngine = await getDatabasesCountByEngine();
    const databasesCount = databasesByEngine.reduce((acc, curr) => acc + curr.count, 0);
    const enginesCount = databasesByEngine.length;

    // True if we group databases by engine in the UI, for clarity.
    const splitDatabasesByEngine = databasesCount > 3 && enginesCount > 1;

    return {
        databases: databases.map(db => {
            const engine = ENGINES_METHODS[db.engine];
            return {
                ...db,
                connectionString: engine.hidePasswordInConnectionString(db.connectionString),
            };
        }),
        splitDatabasesByEngine,
        databasesByEngine,
    };
};
