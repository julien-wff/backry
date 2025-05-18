import type { ENGINES_METHODS } from '$lib/engines/enginesMethods';

export type ApiResponse<T extends object> = {
    error: null;
    data: T;
} | {
    error: string;
    data: null;
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
