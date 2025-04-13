import { jobsListFull } from '$lib/queries/jobs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const jobs = await jobsListFull();

    return {
        jobs,
    };
};
