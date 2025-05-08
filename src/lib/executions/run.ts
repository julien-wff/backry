import type { executions } from '$lib/db/schema';
import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import { createExecution, getExecution, updateExecution } from '$lib/queries/executions';
import { getJob } from '$lib/queries/jobs';
import { executionEmitter } from '$lib/shared/events';
import { backupFromCommand } from '$lib/storages/restic';
import { logger } from '$lib/utils/logger';
import { sql } from 'drizzle-orm';
import { err, ok, type ResultAsync } from 'neverthrow';

/**
 * Start a backup job, by running each database backup in the job one after the other.
 * @param jobId The job ID to start the backup for.
 * @param forcedDatabases The list of database IDs to run the backup for. If null, all databases in the job will be backed up.
 * @returns If error, the error message. If success, void.
 */
export async function startBackup(jobId: number, forcedDatabases: number[] | null = null): Promise<ResultAsync<void, string>> {
    logger.info(`Starting backup for job #${jobId}`);

    const job = await getJob(jobId);
    if (!job) {
        logger.error(`Job #${jobId} not found`);
        return err(`Job #${jobId} not found`);
    }

    let runId = null;
    for (let i = 0; i < job.jobsDatabases.length; i++) {
        if (forcedDatabases && !forcedDatabases.includes(job.jobsDatabases[i].database.id)) {
            logger.debug(`Database #${i} is not in the forced list, skipping`);
            continue;
        }

        const res = await jobDatabaseBackup(job, i, runId, forcedDatabases !== null);
        if (runId === null && res.isOk()) {
            runId = res.value?.runId ?? null;
        }

        // 1s delay between each database backup
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`Backup for job #${jobId} finished`);
    return ok();
}


/**
 * Run a backup for a specific database in a job.
 * @param job The job to run the backup for.
 * @param jobIndex The index of the database in the job to run the backup for.
 * @param runId The run ID to use to link backups together. If null, a new run ID will be created.
 * @param force If true, the backup will be run even if the database is inactive.
 * @returns If error, the error message. If success, void.
 */
async function jobDatabaseBackup(job: NonNullable<Awaited<ReturnType<typeof getJob>>>, jobIndex: number, runId: number | null = null, force = false): Promise<ResultAsync<typeof executions.$inferSelect | null, string>> {
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

    const engine = ENGINES_METHODS[jobDatabase.database.engine];
    const databaseInfo = jobDatabase.database;
    const fileName = `${job.slug}_${databaseInfo.slug}.${engine.dumpFileExtension}`;

    const { id: executionId } = await createExecution(jobDatabase.id, fileName, runId);
    const execution = await getExecution(executionId);
    if (!execution) {
        logger.error(`Error creating execution, execution #${executionId} not found`);
        return err(`Execution #${executionId} not found`);
    }

    const startTime = Date.now();

    const res = await backupFromCommand(
        job.storage.url,
        job.storage.password!,
        job.storage.env,
        engine.getDumpCommand(databaseInfo.connectionString),
        fileName,
        [
            `jobId:${job.id}`,
            `dbId:${databaseInfo.id}`,
        ],
        {
            onStdout: e => e.message_type === 'status' && executionEmitter.emit('update', {
                id: execution.id,
                duration: (Date.now() - startTime) / 1000,
                dumpSize: e.bytes_done ?? null,
            }),
        },
    );

    const backupSummary = res.isOk()
        ? res.value.find(r => r.message_type === 'summary')
        : null;
    const noSummaryErrorMessage = !backupSummary ? 'No result found in command output' : null;

    const updatedExecution = await updateExecution(execution.id, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        error: res.isErr() ? JSON.stringify(res.error) : noSummaryErrorMessage,
        dumpSize: backupSummary?.total_bytes_processed,
        dumpSpaceAdded: backupSummary?.data_added_packed,
        duration: backupSummary?.total_duration,
        snapshotId: backupSummary?.snapshot_id,
    });

    executionEmitter.emit('update', updatedExecution);

    if (res.isErr()) {
        logger.error(res.error, `Error running backup for job #${job.id} database #${jobIndex}`);
        return err(JSON.stringify(res.error));
    }

    logger.info(`Backup for job #${job.id} database #${jobIndex} finished`);
    return ok(updatedExecution);
}
