import { renderNotificationTemplate } from '$lib/editors/notification-template';
import { formatDuration, formatSize } from '$lib/helpers/format';
import { type NOTIFICATION_TRIGGER, notifications } from '$lib/server/db/schema';
import {
    getActiveNotificationsForTrigger,
    setNotificationsFiredAt,
    updateNotification,
} from '$lib/server/queries/notifications';
import { getRunFull } from '$lib/server/queries/runs';
import { logger } from '$lib/server/services/logger';
import { sendShoutrrrNotification } from '$lib/server/services/shoutrrr';
import type { NotificationRunPayload } from '$lib/types/notifications';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { err, ok, type Result } from 'neverthrow';

dayjs.extend(utc);

/**
 * Fires notifications for a specific trigger.
 * It fetches all active notifications for the given trigger, sends them, and updates their status.
 * @param trigger The notification trigger to fire notifications for.
 * @param runId The ID of the run that triggered the notifications.
 */
export async function fireNotificationsForTrigger(trigger: typeof NOTIFICATION_TRIGGER[number], runId: number) {
    const notifications = await getActiveNotificationsForTrigger(trigger);
    let successfulNotificationsIDs: number[] = [];

    const payload = await constructRunPayload(runId);
    if (payload.isErr()) {
        console.error(`Failed to construct notification payload for run ID ${runId}: ${payload.error}`);
        return;
    }

    for (const notification of notifications) {
        const res = await sendNotification(notification, payload.value);
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


/**
 * Create the payload for the notification based on the run ID.
 * @param runId The ID of the run to construct the payload for.
 * @return A Result containing the notification payload or an error message.
 */
async function constructRunPayload(runId: number): Promise<Result<NotificationRunPayload, string>> {
    const run = await getRunFull(runId);
    if (!run) {
        return err(`Run with ID ${runId} not found`);
    }

    return ok({
        runId: run.id,
        jobName: run.backups[0].jobDatabase.job.name,
        storageName: run.backups[0].jobDatabase.job.storage.name,
        isRunSuccessful: run.backups.every(backup => backup.error === null),
        startedAt: run.createdAt!,
        finishedAt: run.finishedAt,
        totalDuration: formatDuration(dayjs.utc(run.finishedAt).diff(dayjs.utc(run.createdAt), 'seconds'), false),
        totalDumpSize: formatSize(run.backups.reduce((acc, backup) => acc + (backup.dumpSize ?? 0), 0)),
        totalDumpSpaceAdded: formatSize(run.backups.reduce((acc, backup) => acc + (backup.dumpSpaceAdded ?? 0), 0)),
        totalBackupCount: run.totalBackupsCount ?? 0,
        successfulBackupCount: run.successfulBackupsCount ?? 0,
        prunedSnapshotCount: run.prunedSnapshotsCount ?? 0,
        backups: run.backups.map(backup => ({
            databaseName: backup.jobDatabase.database.name,
            filename: backup.fileName,
            error: backup.error,
            startedAt: backup.startedAt!,
            finishedAt: backup.finishedAt,
            dumpSize: backup.dumpSize ? formatDuration(backup.dumpSize) : null,
            dumpSpaceAdded: backup.dumpSpaceAdded ? formatDuration(backup.dumpSpaceAdded) : null,
            duration: backup.duration ? formatDuration(backup.duration) : null,
        })),
    });
}


/**
 * Sends a notification using the Shoutrrr service.
 * It renders the title and body templates, then sends the notification.
 * @param notification The notification object to send.
 * @param payload The payload for the notification to compile the templates.
 * @returns A Result indicating success or failure.
 */
async function sendNotification(notification: typeof notifications.$inferSelect, payload: NotificationRunPayload): Promise<Result<void, string>> {
    logger.debug(payload, `Sending notification #${notification.id} for trigger ${notification.trigger}`);
    const notificationTitle = renderNotificationTemplate(notification.title || 'Backry', payload);
    if (notificationTitle.isErr()) {
        return err(`Error with title template: ${notificationTitle.error}`);
    }

    const notificationBody = renderNotificationTemplate(notification.body, payload);
    if (notificationBody.isErr()) {
        return err(`Error with body template: ${notificationBody.error}`);
    }

    return sendShoutrrrNotification(notification.url, notificationBody.value, notificationTitle.value);
}
