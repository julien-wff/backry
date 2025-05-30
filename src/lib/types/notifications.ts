export interface NotificationRunPayload {
    runId: number;
    jobName: string;
    storageName: string;
    isRunSuccessful: boolean;
    startedAt: string;
    finishedAt: string | null;
    totalDuration: string | null;
    totalBackupCount: number;
    successfulBackupCount: number;
    prunedSnapshotsCount: number;
    backups: NotificationBackupPayload[];
}

export interface NotificationBackupPayload {
    databaseName: string;
    filename: string;
    error: string | null;
    startedAt: string;
    finishedAt: string | null;
    dumpSize: string | null;
    dumpSpaceAdded: string | null;
    duration: string | null;
}
