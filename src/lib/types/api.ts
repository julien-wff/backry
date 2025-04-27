import type { ResticError, ResticInit } from '$lib/types/restic';
import type { STORAGE_TYPES } from '$lib/db/schema';

/** `POST /api/storages` */
export interface StoragesCreateRequest {
    name: string;
    type: typeof STORAGE_TYPES[number];
    url: string;
    password: string;
    env: Record<string, string>;
}

/** `POST /api/storages/check` */
export interface StoragesCheckRequest {
    url: string;
    checkRepository?: boolean;
    password?: string;
    env?: Record<string, string>;
}

export interface StoragesCheckResponse {
    error: string | null;
    newLocalUrl: string | null;
    isLocalFolderEmptyEmpty: boolean | null;
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
    slug: string;
    storageId: number;
    cron: string;
    databases: Array<{
        id: number;
    }>;
}
