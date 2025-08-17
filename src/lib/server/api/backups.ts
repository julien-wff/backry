import { itemFromList, positiveInt } from '$lib/helpers/parse';

/**
 * Parses backup filters from URL search parameters.
 * @param params URLSearchParams object containing the filters.
 * @param includePagination Whether to include pagination parameters (cursor and limit).
 * @returns An object containing the parsed filters, ready to pass to {@link getRunsWithBackupFilter}.
 */
export const parseBackupFilters = (params: URLSearchParams, includePagination = false) => ({
    jobId: positiveInt(params.get('job')),
    databaseId: positiveInt(params.get('database')),
    status: itemFromList(params.get('status'), [ 'success', 'error', 'pruned' ]),
    cursor: includePagination ? positiveInt(params.get('cursor'), undefined) : undefined,
    limit: includePagination ? positiveInt(params.get('limit'), undefined) : undefined,
});
