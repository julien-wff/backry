import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ELEMENT_STATUS = [ 'active', 'inactive', 'error' ] as const;
export const DATABASE_ENGINES = [ 'postgresql-16' ] as const;
export const STORAGE_TYPES = [ 'local', 'custom' ] as const;

export const databases = sqliteTable('databases', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    engine: text('engine', { enum: DATABASE_ENGINES }).notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
    created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    connection_string: text('connection_string'),
    host: text('host'),
    port: integer('port'),
    database: text('database'),
    username: text('username'),
    password: text('password'),
});

export const storages = sqliteTable('storages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: STORAGE_TYPES }).notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
    created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    url: text('url').notNull(),
    subPath: text('sub_path').default('/'),
    password: text('password'),
    env: text('env', { mode: 'json' }).notNull().default({}).$type<Record<string, string>>(),
});
