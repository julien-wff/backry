import type { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import type { ResticError, ResticInit } from '$lib/types/restic';

/** `POST /api/databases/check` */
export interface DatabasesCheckResponse {
    error: string | null;
}

/** `POST /api/storages` */
export interface StoragesCreateRequest {
    name: string;
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
    deletePolicy: string;
    databases: Array<{
        id: number;
        enabled: boolean;
    }>;
}

/** `GET /api/integrations/docker/hostnames/[id]` */
export type DockerHostnamesCheckResponse = {
    host: string;
    port: number;
    reachable: boolean;
}[];

/** `POST /api/integrations/docker/connection-string/[id]` */
export interface DockerConnectionStringRequest {
    hostname: string;
    port?: number;
    engine: keyof typeof ENGINES_METHODS;
}
