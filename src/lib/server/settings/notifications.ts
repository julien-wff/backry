import type { NOTIFICATION_TRIGGER } from '$lib/server/db/schema';
import {
    getActiveNotificationsForTrigger,
    setNotificationsFiredAt,
    updateNotification,
} from '$lib/server/queries/notifications';
import { sendShoutrrrNotification } from '$lib/server/services/shoutrrr';

export async function fireNotificationsForTrigger(trigger: typeof NOTIFICATION_TRIGGER[number]) {
    const notifications = await getActiveNotificationsForTrigger(trigger);
    let successfulNotificationsIDs: number[] = [];

    for (const notification of notifications) {
        const res = await sendShoutrrrNotification(notification.url, notification.body);
        if (res.isErr()) {
            updateNotification(notification.id, {
                error: res.error,
                status: 'error',
            });
        } else {
            successfulNotificationsIDs.push(notification.id);
        }
    }

    await setNotificationsFiredAt(successfulNotificationsIDs);
}
