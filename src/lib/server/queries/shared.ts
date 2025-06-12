import { formatSize } from '$lib/helpers/format';
import { db } from '$lib/server/db';
import { backups, databases, jobs, notifications, storages } from '$lib/server/db/schema';
import type { getNextJobs } from '$lib/server/shared/cron';
import { avg, count, desc, eq, inArray, isNotNull, sum } from 'drizzle-orm';

/**
 * Get the number of errors for databases, storages, backups, and notifications.
 * @returns Error count per type.
 */
export async function getErrorCountPerType() {
    const [ errorDbs, errorStorages, errorBackups, errorNotifications ] = await Promise.all([
        db.select({ id: databases.id }).from(databases).where(eq(databases.status, 'error')),
        db.select({ id: storages.id }).from(storages).where(eq(storages.status, 'error')),
        db.select({ id: backups.id }).from(backups).where(isNotNull(backups.error)),
        db.select({ id: notifications.id }).from(notifications).where(eq(notifications.status, 'error')),
    ]);

    return {
        databases: errorDbs.length,
        storages: errorStorages.length,
        backups: errorBackups.length,
        notifications: errorNotifications.length,
    };
}

/**
 * Get the number of warnings for databases, storages, backups.
 * @returns Warning count per type.
 */
export async function getWarningCountPerType() {
    const [ warningStorages ] = await Promise.all([
        db.select({ id: storages.id }).from(storages).where(eq(storages.status, 'unhealthy')),
    ]);

    return {
        storages: warningStorages.length,
    };
}


export async function getDashboardStats(nextJobParams: ReturnType<typeof getNextJobs> = []) {
    const [ dbStats, storageStats, jobsCount, latestBackups, nextJobs, backupsCount, totalStorageSize, avgBackupSize, avgBackupDuration ] = await Promise.all([
        // Databases stats (active, error)
        db.select({ id: databases.id, status: databases.status }).from(databases),
        // Storages stats (active, error)
        db.select({ id: storages.id, status: storages.status }).from(storages),
        // Jobs stats (active, inactive)
        db.select({ id: jobs.id, status: jobs.status }).from(jobs),
        // Latest backups
        db.query.backups.findMany({
            where: isNotNull(backups.finishedAt),
            orderBy: desc(backups.finishedAt),
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
        // Backups count
        db.select({ count: count() }).from(backups),
        // Total storage size
        db.select({ size: sum(storages.diskSize) }).from(storages),
        // Average dump size
        db.select({ size: avg(backups.dumpSize) }).from(backups).where(isNotNull(backups.dumpSize)),
        // Average backup duration
        db.select({ duration: avg(backups.duration) }).from(backups).where(isNotNull(backups.duration)),
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
            unhealthy: storageStats.filter(storage => storage.status === 'unhealthy').length,
        },
        jobs: {
            total: jobsCount.length,
            active: jobsCount.filter(job => job.status === 'active').length,
            inactive: jobsCount.filter(job => job.status === 'inactive').length,
        },
        latestBackups,
        nextJobs: nextJobParams.map(({ jobId, date: nextDate }) => ({
            ...nextJobs.find(j => j.id === jobId),
            nextDate,
        })),
        backupsCount: backupsCount[0]?.count ?? 0,
        totalStorageSize: parseInt(totalStorageSize[0]?.size ?? '0'),
        averageDumpSize: parseInt(avgBackupSize[0]?.size ?? '0'),
        averageBackupDuration: parseFloat(avgBackupDuration[0]?.duration ?? '0'),
    };
}

/**
 * Get statistics that are exposed on the API, used for things like Homepage
 */
export async function getApiStats() {
    const [ backupsStats, jobsStats, databasesStats, storagesStats, diskStats ] = await Promise.all([
        db.query.backups.findMany({
            columns: {
                error: true,
                prunedAt: true,
                finishedAt: true,
            },
        }),
        db.select({ status: jobs.status, count: count() }).from(jobs).groupBy(jobs.status),
        db.select({ status: databases.status, count: count() }).from(databases).groupBy(databases.status),
        db.select({ status: storages.status, count: count() }).from(storages).groupBy(storages.status),
        db.select({ diskSizeTotal: sum(storages.diskSize) }).from(storages),
    ]);

    return {
        backupsError: backupsStats.filter(b => b.error).length,
        backupsPruned: backupsStats.filter(b => !b.error && b.prunedAt).length,
        backupsSuccess: backupsStats.filter(b => !b.error && !b.prunedAt && b.finishedAt).length,
        backupsRunning: backupsStats.filter(b => !b.error && !b.prunedAt && !b.finishedAt).length,
        backupsTotal: backupsStats.length,
        jobsActive: jobsStats.find(j => j.status === 'active')?.count ?? 0,
        jobsTotal: jobsStats.reduce((acc, j) => acc + j.count, 0),
        databasesActive: databasesStats.find(d => d.status === 'active')?.count ?? 0,
        databasesError: databasesStats.find(d => d.status === 'error')?.count ?? 0,
        databasesTotal: databasesStats.reduce((acc, d) => acc + d.count, 0),
        storagesActive: storagesStats.find(s => s.status === 'active')?.count ?? 0,
        storagesError: storagesStats.find(s => s.status === 'error')?.count ?? 0,
        storagesUnhealthy: storagesStats.find(s => s.status === 'unhealthy')?.count ?? 0,
        storagesTotal: storagesStats.reduce((acc, s) => acc + s.count, 0),
        diskSizeTotal: Number.parseInt(diskStats[0].diskSizeTotal ?? '0'),
        diskSizeTotalFormatted: formatSize(Number.parseInt(diskStats[0].diskSizeTotal ?? '0')),
    };
}
