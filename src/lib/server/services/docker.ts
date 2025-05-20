import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { DATABASE_ENGINES } from '$lib/server/db/schema';
import { logger } from '$lib/server/services/logger';
import Docker, { type ContainerInspectInfo, type ImageInspectInfo } from 'dockerode';
import { err, ok, type ResultAsync } from 'neverthrow';

const docker = new Docker();

/**
 * Get all containers from Docker
 * @returns Either an array of ContainerInspectInfo or an error message
 */
export async function getContainers(): Promise<ResultAsync<ContainerInspectInfo[], string>> {
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
export async function inspectContainer(containerId: string): Promise<ResultAsync<ContainerInspectInfo, string>> {
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
export async function getContainersByEngines(): Promise<ResultAsync<Record<typeof DATABASE_ENGINES[number], ContainerInspectInfo[]>, string>> {
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
export async function getImagesFromContainers(containers: ContainerInspectInfo[]): Promise<ResultAsync<Record<string, ImageInspectInfo>, string>> {
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
