import { engines } from '$lib/engines';
import { createExecution, getExecution, updateExecution } from '$lib/queries/executions';
import { getJob } from '$lib/queries/jobs';
import { executionEmitter } from '$lib/shared/events';
import { backupFromCommand } from '$lib/storages/restic';
import { sql } from 'drizzle-orm';
import { err, ok, type ResultAsync } from 'neverthrow';

/**
 * Start a backup job, by running each database backup in the job one after the other.
 * @param jobId The job ID to start the backup for.
 * @returns If error, the error message. If success, void.
 */
export async function startBackup(jobId: number): Promise<ResultAsync<void, string>> {
    const job = await getJob(jobId);
    if (!job) {
        return err(`Job #${jobId} not found`);
    }

    for (let i = 0; i < job.jobsDatabases.length; i++) {
        await jobDatabaseBackup(job, i);
        // 1s delay between each database backup
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return ok();
}


/**
 * Run a backup for a specific database in a job.
 * @param job The job to run the backup for.
 * @param jobIndex The index of the database in the job to run the backup for.
 * @returns If error, the error message. If success, void.
 */
async function jobDatabaseBackup(job: NonNullable<Awaited<ReturnType<typeof getJob>>>, jobIndex: number): Promise<ResultAsync<void, string>> {
    const jobDatabase = job.jobsDatabases[jobIndex];
    if (!jobDatabase) {
        return err(`Cannot get database ${jobIndex} for job #${job.id}`);
    }

    const engine = new engines[jobDatabase.database.engine]();
    const databaseInfo = jobDatabase.database;
    const fileName = `${job.slug}_${databaseInfo.slug}.${engine.dumpFileExtension}`;

    const { id: executionId } = await createExecution(jobDatabase.id, fileName);
    const execution = await getExecution(executionId);
    if (!execution) {
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
        return err(JSON.stringify(res.error));
    }

    return ok();
}
