import { db } from '$lib/db';
import { DATABASE_ENGINES, databases } from '$lib/db/schema';
import { ENGINE_META_ENTRIES } from '$lib/engines/enginesMeta';
import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import { logger } from '$lib/utils/logger';
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
    const engine = ENGINES_METHODS[database.engine];
    const checkResult = await engine.checkConnection(database.connectionString);
    logger.debug(`Checking database connection #${database.id} (${database.engine})`);

    // If the repository is not accessible, update the storage status to error
    if (checkResult.isErr()) {
        if (checkResult.error !== database.error) {
            logger.error(`Error checking database connection #${database.id} (${database.engine}): ${checkResult.error}`);
            await db
                .update(databases)
                .set({
                    status: 'error',
                    error: checkResult.error,
                })
                .where(eq(databases.id, database.id))
                .execute();
        }

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

    logger.debug(`Database connection #${database.id} (${database.engine}) is accessible`);
    return true;
}


export async function getAllEnginesVersionsOrError() {
    const result = {} as Record<typeof DATABASE_ENGINES[number], { version: string | null; error: string | null }>;

    for (const [ engineId ] of ENGINE_META_ENTRIES) {
        const version = await ENGINES_METHODS[engineId].getVersion();
        if (version.isOk()) {
            result[engineId] = { version: version.value, error: null };
        } else {
            result[engineId] = { version: null, error: version.error };
        }
    }

    return result;
}
