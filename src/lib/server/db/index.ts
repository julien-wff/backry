import { env } from '$env/dynamic/private';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const sqlite = new Database(env.DATABASE_URL);
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle({
    client: sqlite,
    schema,
});
