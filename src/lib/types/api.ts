import type { ResticError, ResticInit } from '$lib/storages/restic';
import type { STORAGE_TYPES } from '$lib/db/schema';

/** `POST /api/storages` */
export interface StoragesCreateRequest {
    name: string;
    type: typeof STORAGE_TYPES[number];
    url: string;
    subPath?: string;
    password: string;
    env: Record<string, string>;
}

/** `POST /api/storages/check-local` */
export interface StoragesCheckLocalRequest {
    url: string;
    checkRepository?: boolean;
    password?: string;
    env?: Record<string, string>;
}

export type StoragesCheckLocalResponse = {
    error: string;
    path: string | null;
} | {
    error: null;
    path: string;
    isEmpty: boolean;
    resticError: ResticError | null;
}

/** `POST /api/storages/create-repository` */
export interface StoragesCreateRepositoryRequest {
    url: string;
    password: string;
    env: Record<string, string>;
}

/** `POST /api/storages/create-repository` */
export type StoragesCreateRepositoryResponse = {
    error: ResticError;
    output: null;
} | {
    error: null;
    output: ResticInit;
}

/** `POST /api/jobs` */
export interface JobsCreateRequest {
    name: string;
    storage_id: number;
    cron: string;
    databases: Array<{
        id: number;
        storagePath: string;
    }>;
}
