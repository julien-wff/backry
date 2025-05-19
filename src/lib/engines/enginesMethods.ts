import type { ENGINES_META } from '$lib/engines/enginesMeta';
import { mongodbMethods } from '$lib/engines/mongodbMethods';
import { mysqlMethods } from '$lib/engines/mysqlMethods';
import { postgresMethods } from '$lib/engines/postgresqlMethods';
import { sqliteMethods } from '$lib/engines/sqliteMethods';
import type { EngineMethods } from '$lib/types/engine';

export const ENGINES_METHODS = {
    postgresql: postgresMethods,
    sqlite: sqliteMethods,
    mysql: mysqlMethods,
    mongodb: mongodbMethods,
} as const satisfies Record<keyof typeof ENGINES_META, EngineMethods>;
