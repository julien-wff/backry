import { NOTIFICATION_JOB_FINISHED_EXAMPLE, renderNotificationTemplate } from '$lib/editors/notification-template';
import type { notificationRequest } from '$lib/server/schemas/api';
import { err, ok, Result } from 'neverthrow';

/**
 * Make sure all EJS templates in the notification compile successfully.
 * @param notification The notification object to validate.
 * @return A Result indicating success or failure with an error message.
 */
export function validateNotificationTemplates(notification: Partial<typeof notificationRequest._type>): Result<void, string> {
    if (notification.body) {
        const bodyTemplateResult = renderNotificationTemplate(notification.body, NOTIFICATION_JOB_FINISHED_EXAMPLE);
        if (bodyTemplateResult.isErr()) {
            return err(`Error with body template: ${bodyTemplateResult.error}`);
        }
    }

    return ok();
}
