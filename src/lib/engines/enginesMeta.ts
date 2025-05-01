import type { DATABASE_ENGINES } from '$lib/db/schema';
import type { EngineMeta } from '$lib/types/engine';

export const ENGINES_META = {
    postgresql: {
        displayName: 'PostgreSQL',
        icon: '/icons/postgres.svg',
        connectionStringPlaceholder: 'postgresql://user:password@host:port/database',
    },
    sqlite: {
        displayName: 'SQLite',
        icon: '/icons/sqlite.svg',
        connectionStringPlaceholder: 'sqlite:///path/to/database.db',
    },
} as const satisfies Record<typeof DATABASE_ENGINES[number], EngineMeta>;

export const ENGINE_META_ENTRIES = Object.entries(ENGINES_META) as Array<[ typeof DATABASE_ENGINES[number], EngineMeta ]>;
