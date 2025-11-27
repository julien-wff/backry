import { DATABASE_ENGINES } from '$lib/server/db/schema';
import { getDatabasesWithContainer } from '$lib/server/queries/databases';
import {
    getContainersByEngines,
    getDockerEngine,
    getImagesFromContainers,
    processContainerForClient,
    processImageForClient,
} from '$lib/server/services/docker';
import { getSettings } from '$lib/server/settings/settings';
import { error } from '@sveltejs/kit';
import type { ContainerInspectInfo } from 'dockerode';

type FormattedContainers = Record<typeof DATABASE_ENGINES[number], ReturnType<typeof processContainerForClient>[]>;
type FormattedImages = Record<string, ReturnType<typeof processImageForClient>>;

export const load = async () => {
    const settings = await getSettings();
    if (!settings.dockerURI) {
        throw error(503, 'Docker integration is not configured');
    }

    const docker = getDockerEngine(settings.dockerURI);
    const containersByEngine = await getContainersByEngines(docker);
    if (containersByEngine.isErr()) {
        return {
            containers: {} as FormattedContainers,
            images: {} as FormattedImages,
            databases: [],
            error: containersByEngine.error,
        };
    }

    const containers = Object.keys(containersByEngine.value).reduce((acc, key) => [
        ...acc,
        ...containersByEngine.value[key as keyof typeof containersByEngine.value],
    ], [] as ContainerInspectInfo[]);
    const images = await getImagesFromContainers(docker, containers);

    const containersByEngineFormatted: Record<string, ReturnType<typeof processContainerForClient>[]> = {};
    for (const [ engine, containers ] of Object.entries(containersByEngine.value)) {
        containersByEngineFormatted[engine as typeof DATABASE_ENGINES[number]] = containers.map(processContainerForClient);
    }

    const imagesFormatted: FormattedImages = {};
    for (const [ imageId, image ] of Object.entries(images.isOk() ? images.value : {})) {
        imagesFormatted[imageId] = processImageForClient(image);
    }

    // Associated databases
    const databases = await getDatabasesWithContainer();

    return {
        containers: containersByEngineFormatted as FormattedContainers,
        images: imagesFormatted,
        databases,
        error: images.isErr() ? images.error : null,
    };
};
