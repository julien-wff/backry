import { db } from '$lib/server/db';
import { NOTIFICATION_TRIGGER, notifications } from '$lib/server/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

/**
 * Get all notifications from the database.
 */
export const notificationsList = () => db.query.notifications.findMany();


/**
 * Get a notification by its ID.
 * @param id Notification ID
 */
export const getNotification = (id: number) =>
    db.query.notifications.findFirst({
        where: eq(notifications.id, id),
    });


/**
 * Get all active, non-errored notifications for a specific trigger.
 * @param trigger The notification trigger to filter by
 */
export const getActiveNotificationsForTrigger = (trigger: typeof NOTIFICATION_TRIGGER[number]) =>
    db.query.notifications.findMany({
        where: and(
            eq(notifications.trigger, trigger),
            eq(notifications.status, 'active'),
        ),
    });

/**
 * Create a new notification in the database.
 */
export const createNotification = (notification: typeof notifications.$inferInsert) =>
    db.insert(notifications).values(notification).returning().get();


/**
 * Update an existing notification by its ID.
 * @param id Notification ID
 * @param notification Partial notification data to update
 */
export const updateNotification = (id: number, notification: Partial<typeof notifications.$inferInsert>) =>
    db.update(notifications)
        .set(notification)
        .where(eq(notifications.id, id))
        .returning()
        .get();


/**
 * Set the `firedAt` timestamp to the current time for a list of notification IDs.
 * @param ids Array of notification IDs to update
 */
export const setNotificationsFiredAt = (ids: number[]) =>
    db.update(notifications)
        .set({ firedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(inArray(notifications.id, ids))
        .returning()
        .execute();


/**
 * Delete a notification by its ID.
 */
export const deleteNotification = (id: number) =>
    db.delete(notifications)
        .where(eq(notifications.id, id))
        .returning()
        .get();
