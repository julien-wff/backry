import { db } from '$lib/db';
import { databases, executions, jobs, storages } from '$lib/db/schema';
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


export async function getDashboardStats() {
    const [ dbStats, storageStats, jobsCount ] = await Promise.all([
        db.select({ id: databases.id, status: databases.status }).from(databases),
        db.select({ id: storages.id, status: storages.status }).from(storages),
        db.select({ id: jobs.id, status: jobs.status }).from(jobs),
    ]);

    return {
        databases: {
            total: dbStats.length,
            active: dbStats.filter(db => db.status === 'active').length,
            error: dbStats.filter(db => db.status === 'error').length,
        },
        storages: {
            total: storageStats.length,
            active: storageStats.filter(storage => storage.status === 'active').length,
            error: storageStats.filter(storage => storage.status === 'error').length,
        },
        jobs: {
            total: jobsCount.length,
            active: jobsCount.filter(job => job.status === 'active').length,
            inactive: jobsCount.filter(job => job.status === 'inactive').length,
        },
    };
}
