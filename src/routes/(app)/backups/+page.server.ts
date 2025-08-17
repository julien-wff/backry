import { databasesList } from '$lib/server/queries/databases';
import { jobListLimited } from '$lib/server/queries/jobs';
import { getRunsWithBackupFilter } from '$lib/server/queries/runs';
import type { PageServerLoad } from './$types';
import { parseBackupFilters } from '$lib/server/api/backups';

export const load: PageServerLoad = async ({ url }) => {
    const [ runsData, jobs, databases ] = await Promise.all([
        getRunsWithBackupFilter({ ...parseBackupFilters(url.searchParams), limit: 20 }),
        jobListLimited(),
        databasesList(),
    ]);

    return {
        runsData,
        jobs,
        databases,
    };
};
