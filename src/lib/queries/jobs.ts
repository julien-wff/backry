import { db } from '$lib/db';
import { jobDatabases, jobs } from '$lib/db/schema';
import type { JobsCreateRequest } from '$lib/types/api';

/**
 * Get all jobs with info about the storage and the databases to back up
 */
export const jobsListFull = async () => db
    .query
    .jobs
    .findMany({
        with: {
            jobsDatabases: {
                with: {
                    database: true,
                },
            },
            storage: true,
        },
    });

/**
 * Get a job with info about the storage and the databases to back up
 * @param id
 */
export const getJob = async (id: number) => db
    .query
    .jobs
    .findFirst({
        where: (jobs, { eq }) => eq(jobs.id, id),
        with: {
            jobsDatabases: {
                with: {
                    database: true,
                },
            },
            storage: true,
        },
    });

/**
 * Create a new job with its databases to back up
 * @param req
 */
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
                })
                .execute(),
        ),
    );
}
