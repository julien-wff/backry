import { json, type RequestHandler } from '@sveltejs/kit';
import { inspectContainer } from '$lib/integrations/docker';
import type { DockerConnectionStringRequest } from '$lib/types/api';
import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import type { ConnectionStringParams } from '$lib/types/engine';

/**
 * Generate a connection string for the specified container ID
 */
export const POST: RequestHandler = async ({ params, request }) => {
    const containerId = params.id as string;
    const container = await inspectContainer(containerId);
    if (container.isErr()) {
        return json({ error: container.error }, { status: 404 });
    }

    const { port, hostname, engine } = await request.json() as DockerConnectionStringRequest;
    const engineMethods = ENGINES_METHODS[engine];

    const connectionInfo = {
        ...engineMethods.getCredentialsFromContainer(container.value),
        hostname,
        port,
    } satisfies ConnectionStringParams;

    const connectionString = engineMethods.buildConnectionString(connectionInfo);
    if (connectionString.isErr()) {
        return json({ error: connectionString.error }, { status: 400 });
    }

    return json({ result: connectionString.value.toString() });
};
