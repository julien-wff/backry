import type { RequestHandler } from './$types';
import { getRunsWithBackupFilter } from '#lib/server/queries/runs.ts';
import { apiSuccess } from '#lib/server/api/responses.ts';
import type { RunsQueryResult } from '#lib/server/schemas/api.ts';
import { parseBackupFilters } from '#lib/server/api/backups.ts';

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
