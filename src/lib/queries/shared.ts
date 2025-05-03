import { db } from '$lib/db';
import { databases, executions, jobs, storages } from '$lib/db/schema';
import type { getNextJobs } from '$lib/shared/cron';
import { avg, count, desc, eq, inArray, isNotNull, sum } from 'drizzle-orm';

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
    const [ dbStats, storageStats, jobsCount, latestExecutions, nextJobs, executionsCount, totalStorageSize, avgExecutionSize, avgBackupDuration ] = await Promise.all([
        // Databases stats (active, error)
        db.select({ id: databases.id, status: databases.status }).from(databases),
        // Storages stats (active, error)
        db.select({ id: storages.id, status: storages.status }).from(storages),
        // Jobs stats (active, inactive)
        db.select({ id: jobs.id, status: jobs.status }).from(jobs),
        // Latest executions
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
        // Next jobs
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
        // Executions count
        db.select({ count: count() }).from(executions),
        // Total storage size
        db.select({ size: sum(storages.diskSize) }).from(storages),
        // Average dump size
        db.select({ size: avg(executions.dumpSize) }).from(executions).where(isNotNull(executions.dumpSize)),
        // Average backup duration
        db.select({ duration: avg(executions.duration) }).from(executions).where(isNotNull(executions.duration)),
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
        executionsCount: executionsCount[0]?.count ?? 0,
        totalStorageSize: parseInt(totalStorageSize[0]?.size ?? '0'),
        averageDumpSize: parseInt(avgExecutionSize[0]?.size ?? '0'),
        averageBackupDuration: parseFloat(avgBackupDuration[0]?.duration ?? '0'),
    };
}
