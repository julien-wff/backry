import { db } from '$lib/db';
import { databases } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Fetches a complete list of all databases with all fields.
 */
export const databasesList = () => db.select().from(databases);

/**
 * Fetches a list of all active databases ID and name.
 */
export const activeDatabasesListShort = () =>
    db
        .select({
            id: databases.id,
            name: databases.name,
        })
        .from(databases)
        .where(eq(databases.status, 'active'));
