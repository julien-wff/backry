import { runsListFull } from '$lib/server/queries/runs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const runs = await runsListFull();

    return {
        runs,
    };
};
