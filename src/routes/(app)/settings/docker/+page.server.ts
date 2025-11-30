import type { PageServerLoad } from './$types';
import { getDockerEngine, getDockerInfo } from '$lib/server/services/docker';
import type { Result } from 'neverthrow';

export const load: PageServerLoad = async ({ parent }) => {
    const { settings } = await parent();

    let dockerInfoResult: null | Result<string, string> = null;
    if (settings.dockerURI) {
        const docker = getDockerEngine(settings.dockerURI);
        dockerInfoResult = await getDockerInfo(docker);
    }

    return {
        dockerInfo: dockerInfoResult?.isOk() ? dockerInfoResult.value : null,
        dockerInfoError: dockerInfoResult?.isErr() ? dockerInfoResult.error : null,
    };
};
