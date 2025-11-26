import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { DATABASE_ENGINES } from '$lib/server/db/schema';
import { logger } from '$lib/server/services/logger';
import Docker, { type ContainerInspectInfo, type ImageInspectInfo } from 'dockerode';
import { err, ok, type Result } from 'neverthrow';

const docker = getDockerEngine(process.env.DOCKER_HOST || '/var/run/docker.sock');

interface DockerError extends Error {
    code: string;
    path?: string;
    errno?: number;
}

/**
 * Get a Docker engine instance based on the provided URI.
 * If the URI is not recognized, it defaults to Docker Modem settings.
 * @param uri Docker connection URI
 * @returns Docker instance
 */
export function getDockerEngine(uri: string) {
    const isSocketPath = uri.startsWith('/')
        || uri.startsWith('\\\\.\\pipe\\')
        || uri.startsWith('unix://')
        || uri.startsWith('npipe://');

    if (isSocketPath) {
        return new Docker({ socketPath: uri });
    }

    const isUrl = uri.startsWith('http://')
        || uri.startsWith('https://')
        || uri.startsWith('tcp://');

    if (isUrl) {
        const url = new URL(uri);
        return new Docker({
            host: url.hostname,
            port: url.port || undefined,
            protocol: [ 'http:', 'https:' ].includes(url.protocol)
                ? url.protocol.slice(0, -1) as 'http' | 'https'
                : undefined,
        });
    }

    // TODO: handle other cases (SSH, etc.)
    logger.warn(`Docker URI format not recognized (${uri}), using default Docker connection`);
    return new Docker();
}

/**
 * Test connection to Docker
 * @param uri Docker connection URI
 * @returns Either true if connection is successful or an error message
 */
export async function testDockerConnection(uri: string): Promise<Result<boolean, DockerError>> {
    const docker = getDockerEngine(uri);

    try {
        await docker.ping();
        return ok(true);
    } catch (error) {
        logger.error(error, `Error connecting to Docker`);
        return err(error as DockerError);
    }
}

/**
 * Get all containers from Docker
 * @returns Either an array of ContainerInspectInfo or an error message
 */
export async function getContainers(): Promise<Result<ContainerInspectInfo[], string>> {
    try {
        const containers = await docker.listContainers({ all: true });
        const details = await Promise.all(
            containers.map(({ Id }) => docker.getContainer(Id).inspect()),
        );
        return ok(details);
    } catch (error) {
        logger.error(error, `Error getting containers`);
        return err(error instanceof Error ? error.message : 'Unknown error');
    }
}


/**
 * Inspect a container by its ID
 * @param containerId Docker ID of the container
 * @return Either the ContainerInspectInfo or an error message
 */
export async function inspectContainer(containerId: string): Promise<Result<ContainerInspectInfo, string>> {
    try {
        return ok(await docker.getContainer(containerId).inspect());
    } catch (error) {
        logger.error(error, `Error inspecting container`);
        return err(error instanceof Error ? error.message : 'Unknown error');
    }
}

/**
 * Regroup containers by their database engine
 * @param containers Array of ContainerInspectInfo
 * @returns Object with database engines as keys and arrays of ContainerInspectInfo as values
 */
export function classifyContainersByEngine(containers: ContainerInspectInfo[]): Record<typeof DATABASE_ENGINES[number], ContainerInspectInfo[]> {
    const result = {} as Record<typeof DATABASE_ENGINES[number], ContainerInspectInfo[]>;
    for (const engine of DATABASE_ENGINES) {
        result[engine] = [];
        const engineMethod = ENGINES_METHODS[engine];

        for (const container of containers) {
            if (engineMethod.isDockerContainerFromEngine(container)) {
                result[engine].push(container);
            }
        }
    }
    return result;
}

/**
 * Get containers and classify them by their database engine
 * @returns Either an object with database engines as keys and arrays of ContainerInspectInfo as values or an error message
 */
export async function getContainersByEngines(): Promise<Result<Record<typeof DATABASE_ENGINES[number], ContainerInspectInfo[]>, string>> {
    const containersResult = await getContainers();
    if (containersResult.isErr()) {
        return err(containersResult.error);
    }

    const containers = classifyContainersByEngine(containersResult.value);
    return ok(containers);
}

/**
 * Get images from containers
 * @param containers Array of ContainerInspectInfo
 * @returns Either an object with image names as keys and ImageInspectInfo as values or an error message
 */
export async function getImagesFromContainers(containers: ContainerInspectInfo[]): Promise<Result<Record<string, ImageInspectInfo>, string>> {
    try {
        const images = await Promise.all(
            containers.map(async (container) => [
                container.Image,
                await docker.getImage(container.Image).inspect(),
            ] as const),
        );
        return ok(Object.fromEntries(images));
    } catch (error) {
        logger.error(error, `Error getting images from containers`);
        return err(error instanceof Error ? error.message : 'Unknown error');
    }
}

/**
 * Filter out unnecessary properties from ContainerInspectInfo for client-side use
 * @param container ContainerInspectInfo object
 * @returns Object with only the necessary properties for client-side use
 */
export const processContainerForClient = (container: ContainerInspectInfo) => ({
    id: container.Id,
    name: container.Name.slice(1),
    image: container.Image,
    state: container.State,
    composeStackName: container.Config.Labels?.['com.docker.compose.project'] || container.Config.Labels?.['com.docker.compose.service'] || null,
});

/**
 * Filter out unnecessary properties from ImageInspectInfo for client-side use
 * @param image ImageInspectInfo object
 * @returns Object with only the necessary properties for client-side use
 */
export const processImageForClient = (image: ImageInspectInfo) => ({
    id: image.Id,
    tagName: image.RepoTags?.[0] || `<none> (${image.Id.replace(/^sha256:/, '').slice(0, 12)})`,
});
