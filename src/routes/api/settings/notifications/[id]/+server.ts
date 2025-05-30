import { validateNotificationTemplates } from '$lib/server/api/notifications';
import { apiError, apiSuccess } from '$lib/server/api/responses';
import { deleteNotification, updateNotification } from '$lib/server/queries/notifications';
import { parseRequestBody } from '$lib/server/schemas';
import { notificationPatchRequest, notificationRequest, type NotificationResponse } from '$lib/server/schemas/api';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const notificationId = parseInt(params.id || '');
    if (isNaN(notificationId) || notificationId < 0) {
        return apiError('Invalid notification ID');
    }

    const deletedNotification = deleteNotification(notificationId);
    if (!deletedNotification) {
        return apiError('Notification not found', 404);
    }

    return apiSuccess<NotificationResponse>(deletedNotification, 200);
};


export const PUT: RequestHandler = async ({ request, params }) => {
    const notificationId = parseInt(params.id || '');
    if (isNaN(notificationId) || notificationId < 0) {
        return apiError('Invalid notification ID');
    }

    const body = await parseRequestBody(request, notificationRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    // Check tempaltes
    const templateCheckRes = validateNotificationTemplates(body.value);
    if (templateCheckRes.isErr()) {
        return apiError(templateCheckRes.error, 400);
    }

    const notification = updateNotification(notificationId, body.value);
    return apiSuccess<NotificationResponse>(notification, 200);
};


export const PATCH: RequestHandler = async ({ request, params }) => {
    const notificationId = parseInt(params.id || '');
    if (isNaN(notificationId) || notificationId < 0) {
        return apiError('Invalid notification ID');
    }

    const body = await parseRequestBody(request, notificationPatchRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    // Check templates
    const templateCheckRes = validateNotificationTemplates(body.value);
    if (templateCheckRes.isErr()) {
        return apiError(templateCheckRes.error, 400);
    }

    const notification = updateNotification(notificationId, body.value);
    return apiSuccess<NotificationResponse>(notification, 200);
};
