import { jobsListFull } from '$lib/server/queries/jobs';
import { sendAt, validateCronExpression } from 'cron';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const jobs = await jobsListFull();

    return {
        jobs,
        nextExecutions: jobs.reduce((acc, job) => ({
            ...acc,
            [job.id]: validateCronExpression(job.cron).valid ? sendAt(job.cron).toJSDate() : null,
        }), {} as Record<number, Date | null>),
    };
};
