import { databasesList } from '$lib/server/queries/databases';
import { jobListLimited } from '$lib/server/queries/jobs';
import { runsListFull } from '$lib/server/queries/runs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const [ runs, jobs, databases ] = await Promise.all([
        runsListFull(),
        jobListLimited(),
        databasesList(),
    ]);

    const rawJobId = url.searchParams.get('job');
    const rawDatabaseId = url.searchParams.get('database');
    const rawStatus = url.searchParams.get('status');

    const jobId = !isNaN(parseInt(rawJobId ?? '')) ? parseInt(rawJobId!) : null;
    const databaseId = !isNaN(parseInt(rawDatabaseId ?? '')) ? parseInt(rawDatabaseId!) : null;
    const status = [ 'success', 'error', 'pruned' ].includes(rawStatus!) ? rawStatus : null;

    return {
        runs: runs.map(run => ({
            ...run,
            backups: run.backups.filter(backup =>
                (jobId !== null ? backup.jobDatabase.jobId === jobId : true)
                && (databaseId !== null ? backup.jobDatabase.databaseId === databaseId : true)
                && (status === 'error' ? backup.error : true)
                && (status === 'pruned' ? backup.prunedAt : true)
                && (status === 'success' ? !backup.error && !backup.prunedAt : true),
            ),
        })),
        jobs,
        databases,
    };
};
