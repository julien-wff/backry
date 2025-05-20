import { getDashboardStats } from '$lib/server/queries/shared';
import { getNextJobs } from '$lib/server/shared/cron';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
    const nextJobs = getNextJobs(3);
    const stats = await getDashboardStats(nextJobs);

    return {
        stats,
    };
};
