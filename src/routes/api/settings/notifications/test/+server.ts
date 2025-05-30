import { NOTIFICATION_PAYLOAD_EXAMPLE, renderNotificationTemplate } from '$lib/editors/notification-template';
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

    const notificationTitle = renderNotificationTemplate(body.value.title || 'Backry', NOTIFICATION_PAYLOAD_EXAMPLE);
    if (notificationTitle.isErr()) {
        return apiError(`Error with title template: ${notificationTitle.error}`);
    }

    const notificationBody = renderNotificationTemplate(body.value.body, NOTIFICATION_PAYLOAD_EXAMPLE);
    if (notificationBody.isErr()) {
        return apiError(`Error with body template: ${notificationBody.error}`);
    }

    const result = await sendShoutrrrNotification(body.value.url, notificationBody.value, notificationTitle.value);
    if (result.isErr()) {
        return apiError(result.error);
    }

    return apiSuccess<{}>({}, 201);
};
