import { apiError, apiSuccess } from '$lib/server/api/responses';
import { getResticVersion } from '$lib/server/services/restic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
    const resticVersion = await getResticVersion();

    const checkOk = resticVersion.isOk();

    if (request.headers.get('Accept')?.includes('application/json')) {
        if (checkOk) {
            return apiSuccess<{ status: string }>({ status: 'ok' }, 200);
        } else {
            return apiError('Check failed', 500);
        }
    }

    if (checkOk) {
        return new Response('ok', {
            status: 200,
        });
    } else {
        return new Response('failed', {
            status: 500,
        });
    }
};
