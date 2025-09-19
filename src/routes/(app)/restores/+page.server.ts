import type { PageServerLoad } from './$types';
import { getAllRestoresFull } from '$lib/server/queries/restores';

export const load: PageServerLoad = async () => {
    const restores = await getAllRestoresFull();

    return {
        restores,
    };
};
