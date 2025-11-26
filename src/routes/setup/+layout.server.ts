import { getSettings } from '$lib/server/settings/settings';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    const settings = await getSettings();

    if (settings.setupComplete) {
        throw redirect(303, '/dashboard');
    }
};
