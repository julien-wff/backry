import type { PageServerLoad } from './$types';
import { getAllRestoresFull } from '#lib/server/queries/restores.ts';

export const load: PageServerLoad = async () => {
    const restores = await getAllRestoresFull();

    return {
        restores,
    };
};
