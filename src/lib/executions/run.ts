import { engines } from '$lib/engines';
import { createExecution, getExecution, updateExecution } from '$lib/queries/executions';
import { getJob } from '$lib/queries/jobs';
import { executionEmitter } from '$lib/shared/events';
import { backupFromCommand } from '$lib/storages/restic';
import { sql } from 'drizzle-orm';
import { err, ok, type ResultAsync } from 'neverthrow';

export async function startBackup(jobId: number): Promise<ResultAsync<void, string>> {
    const job = await getJob(jobId);
    if (!job) {
        return err(`Job #${jobId} not found`);
    }

    const engine = new engines[job.jobsDatabases[0].database.engine]();
    const databaseInfo = job.jobsDatabases[0].database;
    const fileName = `${job.slug}_${databaseInfo.slug}.${engine.dumpFileExtension}`;

    const { id: executionId } = await createExecution(job.jobsDatabases[0].id, fileName);
    const execution = await getExecution(executionId);
    if (!execution) {
        return err(`Execution #${executionId} not found`);
    }

    const res = await backupFromCommand(
        job.storage.url,
        job.storage.password!,
        job.storage.env,
        engine.getDumpCommand(databaseInfo.connectionString!),
        fileName,
        [
            `jobId:${job.id}`,
            `dbId:${databaseInfo.id}`,
        ],
        {
            onStdout: e => executionEmitter.emit('update', {
                ...execution,
                id: execution.id,
                fileName: execution.fileName,
                jobDatabaseId: job.jobsDatabases[0].id,
                duration: e.message_type === 'summary' ? e.total_duration : null,
                dumpSize: e.message_type === 'summary' ? e.total_bytes_processed : e.bytes_done ?? null,
            }),
        },
    );

    const backupSummary = res.isOk()
        ? res.value.find(r => r.message_type === 'summary')
        : null;
    const noSummaryErrorMessage = !backupSummary ? 'No result found in command output' : null;

    await updateExecution(execution.id, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        error: res.isErr() ? JSON.stringify(res.error) : noSummaryErrorMessage,
        dumpSize: backupSummary?.total_bytes_processed,
        dumpSpaceAdded: backupSummary?.data_added_packed,
        duration: backupSummary?.total_duration,
        snapshotId: backupSummary?.snapshot_id,
    });

    if (res.isErr()) {
        return err(JSON.stringify(res.error));
    }

    return ok();
}
