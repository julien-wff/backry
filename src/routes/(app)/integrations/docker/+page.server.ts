import { getContainersByEngines, getImagesFromContainers } from '$lib/server/services/docker';
import type { ContainerInspectInfo, ImageInspectInfo } from 'dockerode';

export const load = async () => {
    const containersByEngine = await getContainersByEngines();
    if (containersByEngine.isErr()) {
        return {
            containers: [],
            images: {} as Record<string, ImageInspectInfo>,
            error: containersByEngine.error,
        };
    }

    const containers = Object.keys(containersByEngine.value).reduce((acc, key) => [
        ...acc,
        ...containersByEngine.value[key as keyof typeof containersByEngine.value],
    ], [] as ContainerInspectInfo[]);
    const images = await getImagesFromContainers(containers);

    return {
        containers: containersByEngine.value,
        images: images.isOk() ? images.value : {},
        error: images.isErr() ? images.error : null,
    };
};
