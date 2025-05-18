import { backups, DATABASE_ENGINES, storages } from '$lib/db/schema';
import type { ResticError, ResticInit } from '$lib/types/restic';
import { z } from 'zod';

// DATABASES

/** `POST /api/databases/check` */
export const databasesCheckRequest = z.object({
    connectionString: z.string().nonempty(),
    engine: z.enum(DATABASE_ENGINES),
});

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

/** `POST /api/storages` */
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

// BACKUPS

/** `DELETE /api/backups/[id]` */
export type BackupResponse = typeof backups.$inferSelect;
