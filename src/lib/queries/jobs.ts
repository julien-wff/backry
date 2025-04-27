import { db } from '$lib/db';
import { jobDatabases, jobs } from '$lib/db/schema';
import type { JobsCreateRequest } from '$lib/types/api';
import { eq, or } from 'drizzle-orm';

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
 * Get all active and errored jobs to create CRON jobs.
 * Errors are included so they can be retried.
 */
export const getJobsToExecute = async () => db
    .query
    .jobs
    .findMany({
        where: or(eq(jobs.status, 'active'), eq(jobs.status, 'error')),
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
            slug: req.slug,
            storageId: req.storageId,
            cron: req.cron,
        })
        .returning()
        .get();

    await Promise.all(
        req.databases.map((database) =>
            db
                .insert(jobDatabases)
                .values({
                    jobId: job.id,
                    databaseId: database.id,
                })
                .execute(),
        ),
    );

    return job;
}

/**
 * Delete a job and its databases to back up
 * @param id Job ID
 * @returns Deleted job, or null if not found
 */
export const deleteJob = async (id: number) => db
    .delete(jobs)
    .where(eq(jobs.id, id))
    .returning()
    .get();
