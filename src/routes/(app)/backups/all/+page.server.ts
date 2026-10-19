import { databasesList } from '#lib/server/queries/databases.ts';
import { jobListLimited } from '#lib/server/queries/jobs.ts';
import { getRunsWithBackupFilter } from '#lib/server/queries/runs.ts';
import type { PageServerLoad } from './$types';
import { parseBackupFilters } from '#lib/server/api/backups.ts';

export const load: PageServerLoad = async ({ url }) => {
    const [ runsData, jobs, databases ] = await Promise.all([
        getRunsWithBackupFilter({
            ...parseBackupFilters(url.searchParams),
            limit: 21,
        }),
        jobListLimited(),
        databasesList(),
    ]);

    return {
        runsData,
        jobs,
        databases,
    };
};
