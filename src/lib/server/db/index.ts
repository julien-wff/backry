import { DATABASE_URL } from '$app/env/private';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const sqlite = new Database(DATABASE_URL);

export const db = drizzle({
    client: sqlite,
    schema,
});
