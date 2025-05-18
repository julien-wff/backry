import { backups, DATABASE_ENGINES, databases, jobs, storages } from '$lib/db/schema';
import type { ResticError, ResticInit, ResticLock, ResticSnapshot } from '$lib/types/restic';
import { validateCronExpression } from 'cron';
import { z } from 'zod';

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

/** `POST /api/storages` */
export const storageCreateRequest = z.object({
    name: z.string().min(3),
    url: z.string().nonempty(),
    password: z.string().nonempty(),
    env: z.record(z.string()),
});

/** `POST /api/storages` */
export type StorageCreateRequest = z.infer<typeof storageCreateRequest>;

/**
 * `POST /api/storages`
 * `DELETE /api/storages/[id]`
 */
export type StorageResponse = typeof storages.$inferSelect;

/** `POST /api/storages/check` */
export const storagesCheckRequest = z.object({
    url: z.string().nonempty(),
    checkRepository: z.boolean().optional(),
    password: z.string().optional(),
    env: z.record(z.string()).optional(),
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
    env: z.record(z.string()),
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
    deletePolicy: z.string().optional(),
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
