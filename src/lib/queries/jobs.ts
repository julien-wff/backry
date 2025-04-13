import { db } from '$lib/db';
import { jobDatabases, jobs } from '$lib/db/schema';
import type { JobsCreateRequest } from '$lib/types/api';

export async function createJob(req: JobsCreateRequest) {
    const job = db
        .insert(jobs)
        .values({
            name: req.name,
            storage_id: req.storage_id,
            cron: req.cron,
        })
        .returning()
        .get();

    await Promise.all(
        req.databases.map((database) =>
            db
                .insert(jobDatabases)
                .values({
                    job_id: job.id,
                    database_id: database.id,
                    storagePath: database.storagePath,
                })
                .execute(),
        ),
    );
}
