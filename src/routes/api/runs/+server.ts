import type { RequestHandler } from '@sveltejs/kit';
import { getRunsWithBackupFilter } from '$lib/server/queries/runs';
import { apiSuccess } from '$lib/server/api/responses';
import type { RunsQueryResult } from '$lib/server/schemas/api';
import { parseBackupFilters } from '$lib/server/api/backups';

export const GET: RequestHandler = async ({ url }) => {
    const runsData = await getRunsWithBackupFilter(
        parseBackupFilters(url.searchParams, true),
    );

    return apiSuccess<RunsQueryResult>({
        ...runsData,
        jobs: [ ...runsData.jobs.values() ],
        databases: [ ...runsData.databases.values() ],
    });
};
