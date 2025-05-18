import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import { inspectContainer } from '$lib/integrations/docker';
import { parseRequestBody } from '$lib/schemas';
import { dockerConnectionStringRequest, type DockerConnectionStringResponse } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import { type RequestHandler } from '@sveltejs/kit';

/**
 * Generate a connection string for the specified container ID
 */
export const POST: RequestHandler = async ({ params, request }) => {
    const body = await parseRequestBody(request, dockerConnectionStringRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const containerId = params.id as string;
    const container = await inspectContainer(containerId);
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
