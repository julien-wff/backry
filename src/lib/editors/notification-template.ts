import { formatDuration, formatSize } from '$lib/helpers/format';
import type { NotificationRunContext } from '$lib/types/notifications';
import dayjs from 'dayjs';
import { render } from 'ejs';
import { fromThrowable, Result } from 'neverthrow';

export const NOTIFICATION_PAYLOAD_EXAMPLE = {
    runId: 0,
    jobName: 'Test job',
    storageName: 'Test storage',
    isRunSuccessful: true,
    startedAt: `${dayjs().format('YYYY-MM-DD')} 12:00:00`,
    finishedAt: `${dayjs().format('YYYY-MM-DD')} 12:01:02`,
    totalDuration: formatDuration(34 * 60 + 56.76982),
    totalBackupCount: 2,
    successfulBackupCount: 2,
    prunedSnapshotsCount: 2,
    backups: [
        {
            databaseName: 'Test database',
            filename: 'test-job_test-database.sql',
            error: null,
            startedAt: `${dayjs().format('YYYY-MM-DD')} 12:00:00`,
            finishedAt: `${dayjs().format('YYYY-MM-DD')} 12:00:31`,
            dumpSize: formatSize(123456),
            dumpSpaceAdded: formatSize(789),
            duration: formatDuration(30.76982),
        },
        {
            databaseName: 'Test database 2',
            filename: 'test-job_test-database-2.sql',
            error: null,
            startedAt: `${dayjs().format('YYYY-MM-DD')} 12:00:31`,
            finishedAt: `${dayjs().format('YYYY-MM-DD')} 12:01:02`,
            dumpSize: formatSize(654321),
            dumpSpaceAdded: formatSize(321),
            duration: formatDuration(31.23018),
        },
    ],
} satisfies NotificationRunContext;

export function renderNotificationTemplate(
    template: string,
    data: Record<string, any>,
): Result<string, string> {
    return fromThrowable(
        () => render(template, data, { async: false }),
        e => e instanceof Error ? e.message : String(e),
    )();
}
