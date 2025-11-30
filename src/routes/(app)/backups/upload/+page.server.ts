import type { PageServerLoad } from './$types';
import { jobsListFull } from '$lib/server/queries/jobs';

export const load: PageServerLoad = async () => {
    const jobs = await jobsListFull();

    return {
        jobs,
    };
};
