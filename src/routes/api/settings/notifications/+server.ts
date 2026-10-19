import { validateNotificationTemplates } from '#lib/server/api/notifications.ts';
import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { createNotification } from '#lib/server/queries/notifications.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { notificationRequest, type NotificationResponse } from '#lib/server/schemas/api.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, notificationRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    // Check templates
    const templateCheckRes = validateNotificationTemplates(body.value);
    if (templateCheckRes.isErr()) {
        return apiError(templateCheckRes.error, 400);
    }

    const notification = createNotification(body.value);
    return apiSuccess<NotificationResponse>(notification, 201);
};
