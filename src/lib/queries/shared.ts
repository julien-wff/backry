import { db } from '$lib/db';
import { databases, executions, jobs, storages } from '$lib/db/schema';
import type { getNextJobs } from '$lib/shared/cron';
import { desc, eq, inArray, isNotNull } from 'drizzle-orm';

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


export async function getDashboardStats(nextJobParams: ReturnType<typeof getNextJobs> = []) {
    const [ dbStats, storageStats, jobsCount, latestExecutions, nextJobs ] = await Promise.all([
        db.select({ id: databases.id, status: databases.status }).from(databases),
        db.select({ id: storages.id, status: storages.status }).from(storages),
        db.select({ id: jobs.id, status: jobs.status }).from(jobs),
        db.query.executions.findMany({
            where: isNotNull(executions.finishedAt),
            orderBy: desc(executions.finishedAt),
            limit: 3,
            columns: {
                id: true,
                error: true,
                finishedAt: true,
                duration: true,
                dumpSize: true,
            },
            with: {
                jobDatabase: {
                    with: {
                        job: {
                            columns: { id: true, name: true },
                        },
                        database: {
                            columns: { id: true, name: true },
                        },
                    },
                    columns: {},
                },
            },
        }),
        db.query.jobs.findMany({
            where: inArray(jobs.id, nextJobParams.map(j => j.jobId)),
            columns: { id: true, name: true },
            with: {
                jobsDatabases: {
                    columns: { id: true },
                },
                storage: {
                    columns: { id: true, name: true },
                },
            },
        }),
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
        latestExecutions,
        nextJobs: nextJobParams.map(({ jobId, date: nextDate }) => ({
            ...nextJobs.find(j => j.id === jobId),
            nextDate,
        })),
    };
}
