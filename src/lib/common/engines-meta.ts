import type { DATABASE_ENGINES } from '$lib/server/db/schema';
import type { EngineMeta } from '$lib/types/engine';
import dedent from 'dedent';

export const ENGINES_META = {
    postgresql: {
        displayName: 'PostgreSQL',
        icon: '/icons/postgres.svg',
        connectionStringPlaceholder: 'postgresql://user:password@host:port/database',
        isUrlFromEngine: (url: string) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
        dropOnRestoreMessage: dedent`
            If you enable this option, the destination database will first be deleted (if it exists), then recreated. Use at your own risk.
        `,
    },
    sqlite: {
        displayName: 'SQLite',
        icon: '/icons/sqlite.svg',
        connectionStringPlaceholder: 'sqlite:///path/to/database.db',
        isUrlFromEngine: (url: string) => url.startsWith('/') || url.startsWith('sqlite://'),
        dropOnRestoreMessage: dedent`
            If you enable this option, the destination database file will first be deleted (if it exists). Use at your own risk.
        `,
    },
    mysql: {
        displayName: 'MySQL',
        icon: '/icons/mysql.svg',
        connectionStringPlaceholder: 'mysql://user:password@host:port/database',
        isUrlFromEngine: (url: string) => url.startsWith('mysql://') || url.startsWith('mysql+'),
        dropOnRestoreMessage: dedent`
            If you enable this option, the destination database will first be deleted (if it exists), then recreated. Use at your own risk.
        `,
    },
    mongodb: {
        displayName: 'MongoDB',
        icon: '/icons/mongodb.svg',
        connectionStringPlaceholder: 'mongodb://user:password@host:port/database',
        isUrlFromEngine: (url: string) => url.startsWith('mongodb://') || url.startsWith('mongodb+srv://'),
        dropOnRestoreMessage: dedent`
            If you enable this option, each restored collection will first be dropped (if it exists). Use at your own risk.
        `,
    },
} as const satisfies Record<typeof DATABASE_ENGINES[number], EngineMeta>;

export const ENGINE_META_ENTRIES = Object.entries(ENGINES_META) as Array<[ typeof DATABASE_ENGINES[number], EngineMeta ]>;
