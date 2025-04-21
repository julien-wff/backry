import { PostgresEngine } from '$lib/engines/PostgresEngine';
import type { getJob } from '$lib/queries/jobs';
import { backupFromCommand } from '$lib/storages/restic';

export async function startBackup(job: Awaited<ReturnType<typeof getJob>>) {
    const engine = new PostgresEngine();
    const databaseInfo = job!.jobsDatabases[0].database;

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

    if (res.isErr())
        console.error(res.error);
    else
        console.log(res.value);

    return res;
}
