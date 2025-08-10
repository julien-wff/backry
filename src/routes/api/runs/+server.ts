import type { RequestHandler } from '@sveltejs/kit';
import { getRunsWithBackupFilter } from '$lib/server/queries/runs';
import { apiSuccess } from '$lib/server/api/responses';
import type { RunsQueryResult } from '$lib/server/schemas/api';

export const GET: RequestHandler = async ({ url }) => {
    const rawJobId = url.searchParams.get('job');
    const rawDatabaseId = url.searchParams.get('database');
    const rawStatus = url.searchParams.get('status');
    const rawCursor = url.searchParams.get('cursor');
    const rawLimit = url.searchParams.get('limit');

    const jobId = !isNaN(parseInt(rawJobId ?? '')) ? parseInt(rawJobId!) : null;
    const databaseId = !isNaN(parseInt(rawDatabaseId ?? '')) ? parseInt(rawDatabaseId!) : null;
    const status = ([ 'success', 'error', 'pruned' ].includes(rawStatus!) ? rawStatus : null) as 'success' | 'error' | 'pruned' | null;
    const cursor = rawCursor ? parseInt(rawCursor) : undefined;
    const limit = rawLimit ? parseInt(rawLimit) : undefined;

    const runsData = await getRunsWithBackupFilter({
        jobId,
        databaseId,
        status,
        cursor,
        limit,
    });

    return apiSuccess<RunsQueryResult>({
        ...runsData,
        jobs: [ ...runsData.jobs.values() ],
        databases: [ ...runsData.databases.values() ],
    });
};
