import { db } from '$lib/db';
import { databases, executions, storages } from '$lib/db/schema';
import { eq, isNotNull } from 'drizzle-orm';

/**
 * Get the number of errors for databases, storages, executions.
 * @returns Error count per type.
 */
export async function getErrorCountPerType() {
    const [ errorDbs, errorStorages, errorExecutions ] = await Promise.all([
        db.select({ id: databases.id }).from(databases).where(eq(databases.status, 'error')),
        db.select({ id: storages.id }).from(storages).where(eq(storages.status, 'error')),
        db.select({ id: executions.id }).from(executions).where(isNotNull(executions.error)),
    ]);

    return {
        databases: errorDbs.length,
        storages: errorStorages.length,
        executions: errorExecutions.length,
    };
}
