import { apiError, apiSuccess } from '$lib/server/api/responses';
import { parseRequestBody } from '$lib/server/schemas';
import { notificationTestRequest } from '$lib/server/schemas/api';
import { sendShoutrrrNotification } from '$lib/server/services/shoutrrr';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, notificationTestRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const result = await sendShoutrrrNotification(body.value.url, body.value.body);
    if (result.isErr()) {
        return apiError(result.error);
    }

    return apiSuccess<{}>({}, 201);
};
