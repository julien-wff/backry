import type { ENGINES_META } from '#lib/common/engines-meta.ts';
import { mongodbMethods } from '#lib/server/databases/methods/mongodb.ts';
import { mysqlMethods } from '#lib/server/databases/methods/mysql.ts';
import { postgresqlMethods } from '#lib/server/databases/methods/postgresql.ts';
import { sqliteMethods } from '#lib/server/databases/methods/sqlite.ts';
import type { EngineMethods } from '#lib/types/engine.ts';

export const ENGINES_METHODS = {
    postgresql: postgresqlMethods,
    sqlite: sqliteMethods,
    mysql: mysqlMethods,
    mongodb: mongodbMethods,
} as const satisfies Record<keyof typeof ENGINES_META, EngineMethods>;
