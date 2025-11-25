import { SETUP_STEPS } from '$lib/common/constants';
import { getSettings } from '$lib/server/settings/settings';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({}) => {
    const settings = await getSettings();
    
    if (settings.setupComplete) {
        return redirect(307, '/dashboard');
    } else {
        return redirect(307, `/setup/${SETUP_STEPS[0]}`);
    }
};
