import { SETUP_STEPS } from '$lib/common/constants';
import { getSettings } from '$lib/server/settings/settings';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const settings = await getSettings();

    throw redirect(303, `/setup/${settings.setupCurrentStep ?? SETUP_STEPS[0]}`);
};
