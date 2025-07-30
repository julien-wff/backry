import { databasesList } from '$lib/server/queries/databases';
import { jobListLimited } from '$lib/server/queries/jobs';
import { getRunsWithBackupFilter } from '$lib/server/queries/runs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const rawJobId = url.searchParams.get('job');
    const rawDatabaseId = url.searchParams.get('database');
    const rawStatus = url.searchParams.get('status');

    const jobId = !isNaN(parseInt(rawJobId ?? '')) ? parseInt(rawJobId!) : null;
    const databaseId = !isNaN(parseInt(rawDatabaseId ?? '')) ? parseInt(rawDatabaseId!) : null;
    const status = ([ 'success', 'error', 'pruned' ].includes(rawStatus!) ? rawStatus : null) as 'success' | 'error' | 'pruned' | null;

    const [ runsData, jobs, databases ] = await Promise.all([
        getRunsWithBackupFilter(jobId, databaseId, status),
        jobListLimited(),
        databasesList(),
    ]);

    return {
        runsData,
        jobs,
        databases,
    };
};
