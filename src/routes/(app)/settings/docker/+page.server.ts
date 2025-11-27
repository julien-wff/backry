import { getSettings } from '$lib/server/settings/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const settings = await getSettings();

    return {
        dockerURI: settings.dockerURI,
    };
};
