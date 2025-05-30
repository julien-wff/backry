import { validateNotificationTemplates } from '$lib/server/api/notifications';
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

    // Check tempaltes
    const templateCheckRes = validateNotificationTemplates(body.value);
    if (templateCheckRes.isErr()) {
        return apiError(templateCheckRes.error, 400);
    }

    const notification = createNotification(body.value);
    return apiSuccess<NotificationResponse>(notification, 201);
};
