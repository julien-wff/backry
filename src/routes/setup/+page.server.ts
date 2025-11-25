import { SETUP_STEPS } from '$lib/common/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    throw redirect(303, `/setup/${SETUP_STEPS[0]}`);
};
