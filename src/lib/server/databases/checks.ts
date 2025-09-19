import { ENGINE_META_ENTRIES } from '$lib/common/engines-meta';
import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { db } from '$lib/server/db';
import { DATABASE_ENGINES, databases } from '$lib/server/db/schema';
import { logger } from '$lib/server/services/logger';
import type { EngineMethods } from '$lib/types/engine';
import { eq, or } from 'drizzle-orm';
import { Result } from 'neverthrow';

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


export type EngineCheckKey = `${typeof DATABASE_ENGINES[number]}:${'dump' | 'check' | 'restore'}`;

export interface EngineCheckResult {
    version: string | null;
    error: string | null;
    cmd: string;
    cmdResolved: string | null;
}

/**
 * Create a new EngineCheckResult object from a command and a Result.
 * @param cmd The command that was checked.
 * @param result The result of the command check.
 * @returns An EngineCheckResult object.
 */
const newCheckResult = (cmd: string, result: Result<string, string>) => ({
    version: result.isOk() ? result.value : null,
    error: result.isErr() ? result.error : null,
    cmd,
    cmdResolved: Bun.which(cmd),
}) satisfies EngineCheckResult;

/**
 * Get the versions of all database engines' commands or errors if they are not accessible.
 * @returns A promise that resolves to a record of EngineCheckResult objects.
 */
export async function getAllEnginesVersionsOrError() {
    const result = {} as Record<EngineCheckKey, EngineCheckResult>;

    await Promise.all(ENGINE_META_ENTRIES.map(async ([ engineId ]) => {
        const engine: EngineMethods = ENGINES_METHODS[engineId];

        // Dump command
        result[`${engineId}:dump`] = newCheckResult(engine.dumpCommand, await engine.getDumpCmdVersion());

        // Restore command (if different from dump)
        if (engine.restoreCommand !== engine.dumpCommand) {
            result[`${engineId}:restore`] = newCheckResult(engine.restoreCommand, await engine.getRestoreCmdVersion());
        }

        // Check command (if available and different from dump and restore)
        if (engine.checkCommand && engine.getCheckCmdVersion && engine.checkCommand !== engine.dumpCommand && engine.checkCommand !== engine.restoreCommand) {
            result[`${engineId}:check`] = newCheckResult(engine.checkCommand, await engine.getCheckCmdVersion());
        }
    }));

    return result;
}
