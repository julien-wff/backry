import type { ENGINES_META } from '$lib/server/databases/engines-meta';
import { mongodbMethods } from '$lib/server/databases/methods/mongodb';
import { mysqlMethods } from '$lib/server/databases/methods/mysql';
import { postgresqlMethods } from '$lib/server/databases/methods/postgresql';
import { sqliteMethods } from '$lib/server/databases/methods/sqlite';
import type { EngineMethods } from '$lib/types/engine';

export const ENGINES_METHODS = {
    postgresql: postgresqlMethods,
    sqlite: sqliteMethods,
    mysql: mysqlMethods,
    mongodb: mongodbMethods,
} as const satisfies Record<keyof typeof ENGINES_META, EngineMethods>;
