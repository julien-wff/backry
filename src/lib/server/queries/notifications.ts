import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
 * Delete a notification by its ID.
 */
export const deleteNotification = (id: number) =>
    db.delete(notifications)
        .where(eq(notifications.id, id))
        .returning()
        .get();
