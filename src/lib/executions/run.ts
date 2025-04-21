import { PostgresEngine } from '$lib/engines/PostgresEngine';
import { createExecution, updateExecution } from '$lib/queries/executions';
import type { getJob } from '$lib/queries/jobs';
import { backupFromCommand } from '$lib/storages/restic';
import { sql } from 'drizzle-orm';

export async function startBackup(job: Awaited<ReturnType<typeof getJob>>) {
    const engine = new PostgresEngine();
    const databaseInfo = job!.jobsDatabases[0].database;

    const execution = await createExecution(job!.jobsDatabases[0].id);

    const res = await backupFromCommand(
        job!.storage.url,
        job!.storage.password!,
        job!.storage.env,
        engine.getDumpCommand(databaseInfo.connection_string!),
        `dump.${engine.dumpFileExtension}`,
        [
            `jobId:${job!.id}`,
            `jobName:${job!.name}`,
            `dbId:${databaseInfo.id}`,
            `dbName:${databaseInfo.name}`,
        ],
    );

    const backupSummary = res.isOk()
        ? res.value.find(r => r.message_type === 'summary')
        : null;
    const noSummaryErrorMessage = !backupSummary ? 'No result found in command output' : null;

    await updateExecution(execution.id, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finished_at: sql`(CURRENT_TIMESTAMP)`,
        error: res.isErr() ? res.error.message : noSummaryErrorMessage,
        dump_size: backupSummary?.total_bytes_processed,
        dump_space_added: backupSummary?.data_added,
        duration: backupSummary?.total_duration,
        snapshot_id: backupSummary?.snapshot_id,
    });

    return res;
}
