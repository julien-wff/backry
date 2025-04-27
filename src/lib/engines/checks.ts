import { db } from '$lib/db';
import { databases } from '$lib/db/schema';
import { engines } from '$lib/engines/index';
import { eq, or } from 'drizzle-orm';

/**
 * Check if all active or errored databases are accessible and update their status accordingly.
 */
export async function checkAllActiveDatabases() {
    const storagesList = await db
        .select()
        .from(databases)
        .where(or(eq(databases.status, 'active'), eq(databases.status, 'error')))
        .execute();

    for (const storage of storagesList) {
        await checkDatabase(storage);
    }
}


/**
 * Check if a database is accessible and update the storage status accordingly.
 * @param database The database object to check.
 * @returns A promise that resolves to a boolean indicating if the database is accessible.
 */
export async function checkDatabase(database: typeof databases.$inferSelect) {
    const engine = new engines[database.engine]();
    const checkResult = await engine.checkConnection(database.connectionString);

    // If the repository is not accessible, update the storage status to error
    if (checkResult.isErr()) {
        await db
            .update(databases)
            .set({
                status: 'error',
                error: checkResult.error,
            })
            .where(eq(databases.id, database.id))
            .execute();

        return false;
    }

    // If there was an error but now the repository is accessible, update the storage status to ok
    if (database.status === 'error') {
        await db
            .update(databases)
            .set({
                status: 'active',
                error: null,
            })
            .where(eq(databases.id, database.id))
            .execute();
    }

    return true;
}
