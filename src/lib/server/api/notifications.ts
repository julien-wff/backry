import { NOTIFICATION_PAYLOAD_EXAMPLE, renderNotificationTemplate } from '$lib/editors/notification-template';
import type { notificationRequest } from '$lib/server/schemas/api';
import { err, ok, Result } from 'neverthrow';
import type { z } from 'zod';

/**
 * Make sure all EJS templates in the notification compile successfully.
 * @param notification The notification object to validate.
 * @return A Result indicating success or failure with an error message.
 */
export function validateNotificationTemplates(notification: Partial<z.infer<typeof notificationRequest>>): Result<void, string> {
    if (notification.body) {
        const templateResult = renderNotificationTemplate(notification.body, NOTIFICATION_PAYLOAD_EXAMPLE);
        if (templateResult.isErr()) {
            return err(`Error with body template: ${templateResult.error}`);
        }
    }

    if (notification.title) {
        const templateResult = renderNotificationTemplate(notification.title, NOTIFICATION_PAYLOAD_EXAMPLE);
        if (templateResult.isErr()) {
            return err(`Error with title template: ${templateResult.error}`);
        }
    }

    return ok();
}
