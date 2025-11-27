import { apiError, apiSuccess } from '$lib/server/api/responses';
import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { parseRequestBody } from '$lib/server/schemas';
import { dockerConnectionStringRequest, type DockerConnectionStringResponse } from '$lib/server/schemas/api';
import { getDockerEngine, inspectContainer } from '$lib/server/services/docker';
import { getSettings } from '$lib/server/settings/settings';
import type { RequestHandler } from './$types';

/**
 * Generate a connection string for the specified container ID
 */
export const POST: RequestHandler = async ({ params, request }) => {
    const settings = await getSettings();
    if (!settings.dockerURI) {
        return apiError('Docker integration is not configured', 503);
    }

    const docker = getDockerEngine(settings.dockerURI);

    const body = await parseRequestBody(request, dockerConnectionStringRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const container = await inspectContainer(docker, params.id);
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

    return apiSuccess<DockerConnectionStringResponse>({ result: connectionString.value.toString() });
};
