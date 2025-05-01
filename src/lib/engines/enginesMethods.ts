import type { ENGINES_META } from '$lib/engines/enginesMeta';
import { postgresMethods } from '$lib/engines/postgresqlMethods';
import { sqliteMethods } from '$lib/engines/sqliteMethods';
import type { EngineMethods } from '$lib/types/engine';

export const ENGINES_METHODS = {
    postgresql: postgresMethods,
    sqlite: sqliteMethods,
} as const satisfies Record<keyof typeof ENGINES_META, EngineMethods>;
