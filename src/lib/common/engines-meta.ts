import type { DATABASE_ENGINES } from '$lib/server/db/schema';
import type { EngineMeta } from '$lib/types/engine';

export const ENGINES_META = {
    postgresql: {
        displayName: 'PostgreSQL',
        icon: '/icons/postgres.svg',
        connectionStringPlaceholder: 'postgresql://user:password@host:port/database',
        isUrlFromEngine: (url: string) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    },
    sqlite: {
        displayName: 'SQLite',
        icon: '/icons/sqlite.svg',
        connectionStringPlaceholder: 'sqlite:///path/to/database.db',
        isUrlFromEngine: (url: string) => url.startsWith('/') || url.startsWith('sqlite://'),
    },
    mysql: {
        displayName: 'MySQL',
        icon: '/icons/mysql.svg',
        connectionStringPlaceholder: 'mysql://user:password@host:port/database',
        isUrlFromEngine: (url: string) => url.startsWith('mysql://') || url.startsWith('mysql+'),
    },
    mongodb: {
        displayName: 'MongoDB',
        icon: '/icons/mongodb.svg',
        connectionStringPlaceholder: 'mongodb://user:password@host:port/database',
        isUrlFromEngine: (url: string) => url.startsWith('mongodb://') || url.startsWith('mongodb+srv://'),
    },
} as const satisfies Record<typeof DATABASE_ENGINES[number], EngineMeta>;

export const ENGINE_META_ENTRIES = Object.entries(ENGINES_META) as Array<[ typeof DATABASE_ENGINES[number], EngineMeta ]>;
