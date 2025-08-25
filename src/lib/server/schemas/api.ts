import {
    backups,
    DATABASE_ENGINES,
    databases,
    ELEMENT_STATUS,
    jobs,
    NOTIFICATION_TRIGGER,
    notifications,
    runs,
    storages,
} from '$lib/server/db/schema';
import type { Desyncedbackup } from '$lib/server/storages/health';
import type { ResticError, ResticInit, ResticLock, ResticSnapshot } from '$lib/types/restic';
import { validateCronExpression } from 'cron';
import { z } from 'zod';
import type { getRunsWithBackupFilter } from '$lib/server/queries/runs';

export const DATABASE_ALLOWED_STATUSES = [ 'active', 'error' ] as const satisfies readonly typeof ELEMENT_STATUS[number][];
export const STORAGE_ALLOWED_STATUSES = [ 'active', 'unhealthy' ] as const satisfies readonly typeof ELEMENT_STATUS[number][];

// DATABASES

/**
 * `POST /api/databases`
 * `PUT /api/databases/[id]`
 */
export const databaseRequest = z.object({
    engine: z.enum(DATABASE_ENGINES),
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    connectionString: z.string().min(2),
    containerName: z.string().trim().regex(/[a-zA-Z0-9][a-zA-Z0-9_.-]*/).max(63).optional().nullable(),
    status: z.enum(DATABASE_ALLOWED_STATUSES).optional(),
    error: z.string().min(2).nullable().optional(),
});


/** `POST /api/databases/check` */
export const databasesCheckRequest = z.object({
    connectionString: z.string().nonempty(),
    engine: z.enum(DATABASE_ENGINES),
});

/**
 * `POST /api/databases`
 * `PUT /api/databases/[id]`
 * `DELETE /api/databases/[id]`
 */
export type DatabaseResponse = typeof databases.$inferSelect;

// STORAGES

/**
 * `POST /api/storages`
 * `PUT /api/storages/[id]`
 */
export const storageRequest = z.object({
    name: z.string().min(3),
    url: z.string().nonempty(),
    password: z.string().nonempty(),
    env: z.record(z.string(), z.string()),
});

/** `PATCH /api/storages/[id]` */
export const storagePatchRequest = storageRequest.partial().extend({
    status: z.enum(STORAGE_ALLOWED_STATUSES).optional(),
});

/**
 * `POST /api/storages`
 * `PUT /api/storages/[id]`
 */
export type StorageRequest = z.infer<typeof storageRequest>;

/**
 * `POST /api/storages`
 * `PUT /api/storages/[id]`
 * `DELETE /api/storages/[id]`
 */
export type StorageResponse = typeof storages.$inferSelect;

/** `POST /api/storages/check` */
export const storagesCheckRequest = z.object({
    url: z.string().nonempty(),
    checkRepository: z.boolean().optional(),
    password: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
});

/** `POST /api/storages/check` */
export interface StoragesCheckResponse {
    error: string | null;
    newLocalUrl: string | null;
    isLocalFolderEmptyEmpty: boolean | null;
    resticError: ResticError | null;
}

/** `POST /api/storages/init-repository` */
export const storageInitRepositoryRequest = z.object({
    url: z.string().nonempty(),
    password: z.string().nonempty(),
    env: z.record(z.string(), z.string()),
});

/** `POST /api/storages/init-repository` */
export interface StoragesInitRepositoryResponse {
    output: ResticInit;
}

// STORAGES HEALTH

/** `GET /api/storages/[id]/locks` */
export interface StorageLocksResponse {
    locks: ResticLock[];
}

/** `GET /api/storages/[id]/stale-snapshots` */
export interface StorageStaleSnapshotsResponse {
    snapshots: ResticSnapshot[];
}

/** `DELETE /api/storages/[id]/stale-snapshots` */
export const storageStaleSnapshotsDeleteRequest = z.object({
    snapshots: z.array(z.string()),
});

/** `GET /api/storages/[id]/prune-desync` */
export interface StoragePruneDesyncResponse {
    backups: Desyncedbackup[];
}

/** `POST /api/storages/[id]/prune-desync` */
export const storagePruneDesyncUpdateRequest = z.object({
    backups: z.array(z.number().positive()),
});

// JOBS

/**
 * `POST /api/jobs`
 * `PUT /api/jobs/[id]`
 */
export const jobRequest = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    storageId: z.number().positive(),
    cron: z.string().min(2).refine(val => validateCronExpression(val).valid, 'Invalid cron expression'),
    prunePolicy: z.string().optional(),
    databases: z.array(
        z.object({
            id: z.number().positive(),
            enabled: z.boolean(),
        }),
    ).min(1),
});

/**
 * `POST /api/jobs`
 * `PUT /api/jobs/[id]`
 */
export type JobRequest = z.infer<typeof jobRequest>;

/** `PATCH /api/jobs/[id]` */
export const jobPatchRequest = z.object({
    status: z.enum([ 'active', 'inactive' ]),
});

/**
 * `POST /api/jobs`
 * `PUT /api/jobs/[id]`
 * `PATCH /api/jobs/[id]`
 * `DELETE /api/jobs/[id]`
 */
export type JobResponse = typeof jobs.$inferSelect;

/** `POST /api/jobs/[id]/run` */
export const jobRunRequest = z.object({
    databases: z.array(
        z.number().min(0),
    ).optional(),
});

// BACKUPS

/** `DELETE /api/backups/[id]` */
export type BackupResponse = typeof backups.$inferSelect;

// RUNS

/** `GET /api/runs` */
type GetRunsResult = Awaited<ReturnType<typeof getRunsWithBackupFilter>>;
// Convert maps to arrays to JSON stringify properly
export type RunsQueryResult = Omit<GetRunsResult, 'jobs' | 'databases'> & {
    jobs: Array<GetRunsResult['jobs'] extends Map<any, infer I> ? I : never>;
    databases: Array<GetRunsResult['databases'] extends Map<any, infer I> ? I : never>;
}

/** `DELETE /api/runs/[id]` */
export type RunResponse = typeof runs.$inferSelect;

// DOCKER INTEGRATION

/** `POST /api/integrations/docker/connection-string` */
export const dockerConnectionStringRequest = z.object({
    port: z.number().positive().optional(),
    hostname: z.string().nonempty(),
    engine: z.enum(DATABASE_ENGINES),
});

/** `POST /api/integrations/docker/connection-string` */
export interface DockerConnectionStringResponse {
    result: string;
}

/** `GET /api/integrations/docker/hostnames/[id]` */
export interface DockerHostnamesCheckResponse {
    ips: {
        host: string;
        port: number;
        reachable: boolean;
    }[];
}

// SETTINGS

/** `POST /api/settings/notifications/test` */
export const notificationTestRequest = z.object({
    url: z.url().nonempty().trim(),
    body: z.string().nonempty().trim(),
    title: z.string().min(2).trim().optional().nullable(),
});

/**
 * `POST /api/settings/notifications`
 * `PUT /api/settings/notifications/[id]`
 * `DELETE /api/settings/notifications/[id]`
 */
export const notificationRequest = notificationTestRequest.extend({
    name: z.string().min(2).trim(),
    trigger: z.enum(NOTIFICATION_TRIGGER),
});

/** `PATCH /api/settings/notifications/[id]` */
export const notificationPatchRequest = notificationRequest.partial().extend({
    status: z.enum(ELEMENT_STATUS).optional(),
});

/**
 * `POST /api/settings/notifications`
 * `PUT /api/settings/notifications/[id]`
 * `PATCH /api/settings/notifications/[id]`
 * `DELETE /api/settings/notifications/[id]`
 */
export type NotificationResponse = typeof notifications.$inferSelect;
