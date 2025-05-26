import { apiError, apiSuccess } from '$lib/server/api/responses';
import { createNotification } from '$lib/server/queries/notifications';
import { parseRequestBody } from '$lib/server/schemas';
import { notificationRequest, type NotificationResponse } from '$lib/server/schemas/api';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, notificationRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const notification = createNotification(body.value);
    return apiSuccess<NotificationResponse>(notification, 201);
};
