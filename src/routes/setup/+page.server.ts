import { SETUP_STEPS } from '#lib/common/constants.ts';
import { getSettings } from '#lib/server/settings/settings.ts';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const settings = await getSettings();

    throw redirect(303, `/setup/${settings.setupCurrentStep ?? SETUP_STEPS[0]}`);
};
