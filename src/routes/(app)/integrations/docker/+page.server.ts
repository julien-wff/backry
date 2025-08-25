import {
    getContainersByEngines,
    getImagesFromContainers,
    processContainerForClient,
    processImageForClient,
} from '$lib/server/services/docker';
import type { ContainerInspectInfo } from 'dockerode';
import { DATABASE_ENGINES } from '$lib/server/db/schema';

type FormattedContainers = Record<typeof DATABASE_ENGINES[number], ReturnType<typeof processContainerForClient>[]>;

export const load = async () => {
    const containersByEngine = await getContainersByEngines();
    if (containersByEngine.isErr()) {
        return {
            containers: {} as FormattedContainers,
            images: {},
            error: containersByEngine.error,
        };
    }

    const containers = Object.keys(containersByEngine.value).reduce((acc, key) => [
        ...acc,
        ...containersByEngine.value[key as keyof typeof containersByEngine.value],
    ], [] as ContainerInspectInfo[]);
    const images = await getImagesFromContainers(containers);

    const containersByEngineFormatted: Record<string, ReturnType<typeof processContainerForClient>[]> = {};
    for (const [ engine, containers ] of Object.entries(containersByEngine.value)) {
        containersByEngineFormatted[engine as typeof DATABASE_ENGINES[number]] = containers.map(processContainerForClient);
    }

    const imagesFormatted: Record<string, ReturnType<typeof processImageForClient>> = {};
    for (const [ imageId, image ] of Object.entries(images.isOk() ? images.value : {})) {
        imagesFormatted[imageId] = processImageForClient(image);
    }

    return {
        containers: containersByEngineFormatted as FormattedContainers,
        images: imagesFormatted,
        error: images.isErr() ? images.error : null,
    };
};
