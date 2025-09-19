import { apiError, apiSuccess } from '$lib/server/api/responses';
import { getApiStats } from '$lib/server/queries/shared';
import { logger } from '$lib/server/services/logger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const stats = await getApiStats();
        return apiSuccess(stats);
    } catch (e) {
        logger.error(e, 'Failed to get stats');
        return apiError(e instanceof Error ? e.message : String(e), 500);
    }
};
