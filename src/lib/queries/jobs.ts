import { db } from '$lib/db';
import { jobDatabases, jobs } from '$lib/db/schema';
import type { JobsCreateRequest } from '$lib/types/api';
import { and, eq, notInArray, or } from 'drizzle-orm';

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
                orderBy: (jobDatabases, { asc }) => asc(jobDatabases.position),
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
                orderBy: (jobDatabases, { asc }) => asc(jobDatabases.position),
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
        req.databases.map((database, index) =>
            db
                .insert(jobDatabases)
                .values({
                    jobId: job.id,
                    databaseId: database.id,
                    status: database.enabled ? 'active' : 'inactive',
                    position: index,
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

/**
 * Update a job and its databases to back up
 * @param id Job ID
 * @param job Job data
 */
export const updateJob = async (id: number, job: JobsCreateRequest) => {
    const updatedJob = db
        .update(jobs)
        .set({
            name: job.name,
            slug: job.slug,
            storageId: job.storageId,
            cron: job.cron,
        })
        .where(eq(jobs.id, id))
        .returning()
        .get();

    if (!updatedJob) {
        return null;
    }

    const providedDatabaseIds = job.databases.map(db => db.id);

    await db
        .delete(jobDatabases)
        .where(and(
            eq(jobDatabases.jobId, id),
            notInArray(jobDatabases.databaseId, providedDatabaseIds),
        ))
        .execute();

    await Promise.all(
        job.databases.map((database, index) => {
            const newStatus = database.enabled ? 'active' : 'inactive';
            return db
                .insert(jobDatabases)
                .values({
                    jobId: updatedJob.id,
                    databaseId: database.id,
                    status: newStatus,
                    position: index,
                })
                .onConflictDoUpdate({
                    target: [ jobDatabases.jobId, jobDatabases.databaseId ],
                    set: {
                        status: newStatus,
                        position: index,
                    },
                })
                .execute();
        }),
    );

    return updatedJob;
};
