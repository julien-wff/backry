import type { ENGINES_METHODS } from '$lib/engines/enginesMethods';

export type ApiResponse<T extends object> = {
    error: null;
    data: T;
} | {
    error: string;
    data: null;
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
