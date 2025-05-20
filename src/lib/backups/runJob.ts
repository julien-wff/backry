import type { backups } from '$lib/db/schema';
import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import { createBackup, setBackupsToPruned, updateBackup } from '$lib/queries/backups';
import { getJob } from '$lib/queries/jobs';
import { createRun, updateRun } from '$lib/queries/runs';
import { backupEmitter } from '$lib/shared/events';
import { applyForgetPolicy, backupFromCommand } from '$lib/storages/restic';
import type { EngineMethods } from '$lib/types/engine';
import { logger } from '$lib/utils/logger';
import { sql } from 'drizzle-orm';
import { err, ok, type ResultAsync } from 'neverthrow';

/**
 * Start a backup job, by running each database backup in the job one after the other.
 * @param jobId The job ID to start the backup for.
 * @param forcedDatabases The list of database IDs to run the backup for. If null, all databases in the job will be backed up.
 * @returns If error, the error message. If success, void.
 */
export async function runJob(jobId: number, forcedDatabases: number[] | null = null): Promise<ResultAsync<void, string>> {
    logger.info(`Starting backup for job #${jobId}`);

    const job = await getJob(jobId);
    if (!job) {
        logger.error(`Job #${jobId} not found`);
        return err(`Job #${jobId} not found`);
    }

    const run = createRun(forcedDatabases ? 'manual' : 'scheduled');
    let totalDatabases = 0;
    let successfulDatabases = 0;

    for (let i = 0; i < job.jobsDatabases.length; i++) {
        if (forcedDatabases && !forcedDatabases.includes(job.jobsDatabases[i].database.id)) {
            logger.debug(`Database #${i} is not in the forced list, skipping`);
            continue;
        }

        const res = await jobDatabaseBackup(job, i, run.id, forcedDatabases !== null);

        totalDatabases++;
        if (res.isOk()) {
            successfulDatabases++;
        }

        // 1s delay between each database backup
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    updateRun(run.id, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        totalBackupsCount: totalDatabases,
        successfulBackupsCount: successfulDatabases,
    });

    logger.info(`Backup for job #${jobId} finished`);
    return ok();
}


/**
 * Run a backup for a specific database in a job.
 * @param job The job to run the backup for.
 * @param jobIndex The index of the database in the job to run the backup for.
 * @param runId The run ID to use to link backups together.
 * @param force If true, the backup will be run even if the database is inactive.
 * @returns If error, the error message. If success, void.
 */
async function jobDatabaseBackup(job: NonNullable<Awaited<ReturnType<typeof getJob>>>, jobIndex: number, runId: number, force = false): Promise<ResultAsync<typeof backups.$inferSelect | null, string>> {
    logger.info(`Starting backup for job #${job.id} database #${jobIndex}`);

    const jobDatabase = job.jobsDatabases[jobIndex];
    if (!jobDatabase) {
        logger.error(`Database #${jobIndex} not found for job #${job.id}`);
        return err(`Cannot get database ${jobIndex} for job #${job.id}`);
    }

    if (!force && jobDatabase.status === 'inactive') {
        logger.info(`Database #${jobIndex} is inactive, skipping`);
        return ok(null);
    }

    const engine: EngineMethods = ENGINES_METHODS[jobDatabase.database.engine];
    const databaseInfo = jobDatabase.database;
    const fileName = `${job.slug}_${databaseInfo.slug}.${engine.dumpFileExtension}`;

    const backup = await createBackup(jobDatabase.id, fileName, runId);
    const startTime = Date.now();

    backupEmitter.emit('update', backup);

    const res = await backupFromCommand(
        job.storage.url,
        job.storage.password!,
        {
            ...job.storage.env,
            ...engine.getDumpEnv?.(databaseInfo),
        },
        engine.getDumpCommand(databaseInfo.connectionString),
        fileName,
        [
            `jobId:${job.id}`,
            `dbId:${databaseInfo.id}`,
        ],
        {
            onStdout: e => e.message_type === 'status' && backupEmitter.emit('update', {
                id: backup.id,
                duration: (Date.now() - startTime) / 1000,
                dumpSize: e.bytes_done ?? null,
            }),
        },
    );

    const backupSummary = res.isOk()
        ? res.value.find(r => r.message_type === 'summary')
        : null;
    const noSummaryErrorMessage = !backupSummary ? 'No result found in command output' : null;

    const updatedBackup = await updateBackup(backup.id, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        error: res.isErr() ? res.error[0].message : noSummaryErrorMessage,
        dumpSize: backupSummary?.total_bytes_processed,
        dumpSpaceAdded: backupSummary?.data_added_packed,
        duration: backupSummary?.total_duration,
        snapshotId: backupSummary?.snapshot_id,
    });

    backupEmitter.emit('update', updatedBackup);

    if (res.isErr()) {
        logger.error(res.error, `Error running backup for job #${job.id} database #${jobIndex}`);
        return err(JSON.stringify(res.error));
    }

    // Apply prune policy by deleting snapshots, update them in database and update the client
    if (job.deletePolicy) {
        const forgetResult = await applyForgetPolicy(
            job.storage.url,
            job.storage.password!,
            job.storage.env,
            job.deletePolicy,
            job.id,
            jobDatabase.database.id,
        );
        if (forgetResult.isErr()) {
            logger.error(forgetResult.error, `Error applying forget policy for job #${job.id}`);
            return err(`Error applying forget policy: ${forgetResult.error.message}`);
        }

        const forgetStats = forgetResult.value[0][0];
        logger.info(`Forget policy applied for job #${job.id} database #${jobIndex}: ${forgetStats.remove?.length ?? 0} snapshots removed, ${forgetStats.keep?.length ?? 0} kept`);
        logger.debug({
            snapshotKept: forgetStats.keep?.map(s => ({
                id: s.short_id,
                matches: forgetStats.reasons?.find(r => r.snapshot.short_id === s.short_id)?.matches,
            })),
            snapshotRemoved: forgetStats.remove?.map(s => s.short_id),
        }, 'Forget summary');

        if (forgetStats.remove && forgetStats.remove.length > 0) {
            const updatedBackups = await setBackupsToPruned(forgetStats.remove.map(s => s.id));
            for (const backup of updatedBackups) {
                backupEmitter.emit('update', backup);
            }
        }
    }

    logger.info(`Backup for job #${job.id} database #${jobIndex} finished`);
    return ok(updatedBackup);
}
