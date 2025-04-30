import { getDashboardStats } from '$lib/queries/shared';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
    const stats = await getDashboardStats();

    return {
        stats,
    };
};
