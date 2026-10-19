import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { ENGINES_METHODS } from '#lib/server/databases/engines-methods.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { dockerConnectionStringRequest, type DockerConnectionStringResponse } from '#lib/server/schemas/api.ts';
import { getDockerEngineFromSettings, inspectContainer } from '#lib/server/services/docker.ts';
import type { RequestHandler } from './$types';

/**
 * Generate a connection string for the specified container ID
 */
export const POST: RequestHandler = async ({ params, request }) => {
    const docker = await getDockerEngineFromSettings();
    if (docker.isErr()) {
        return apiError(docker.error, 503);
    }

    const body = await parseRequestBody(request, dockerConnectionStringRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const container = await inspectContainer(docker.value, params.id);
    if (container.isErr()) {
        return apiError(container.error, 404);
    }

    const engineMethods = ENGINES_METHODS[body.value.engine];

    const connectionString = engineMethods.buildConnectionString({
        ...engineMethods.getCredentialsFromContainer(container.value),
        hostname: body.value.hostname,
        port: body.value.port,
    });
    if (connectionString.isErr()) {
        return apiError(connectionString.error);
    }

    return apiSuccess<DockerConnectionStringResponse>({
        result: connectionString.value.toString(),
    });
};
