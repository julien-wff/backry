import { db } from '$lib/db';
import { databases } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Fetches a complete list of all databases with all fields.
 */
export const databasesList = () => db.select().from(databases);

/**
 * Fetches a database by ID.
 * @param id The ID of the database to fetch.
 * @returns The database record or null if not found.
 */
export const getDatabase = (id: number) =>
    db.query.databases.findFirst({
        where: eq(databases.id, id),
    });

/**
 * Creates a new database record.
 * @param values Database information to insert.
 * @returns The created database record.
 */
export const createDatabase = (values: typeof databases.$inferInsert) =>
    db.insert(databases).values(values).returning().get();

/**
 * Updates an existing database record by ID.
 * @param id The ID of the database to update.
 * @param values The new values to update the database with.
 * @returns The updated database record, or null if not found.
 */
export const updateDatabase = (id: number, values: typeof databases.$inferInsert) =>
    db
        .update(databases)
        .set(values)
        .where(eq(databases.id, id))
        .returning()
        .get();

/**
 * Deletes a database by ID.
 * @param id - The ID of the database to delete.
 * @returns The deleted database record.
 */
export const deleteDatabase = (id: number) =>
    db.delete(databases).where(eq(databases.id, id)).returning().get();
