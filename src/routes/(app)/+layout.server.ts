import { getErrorCountPerType } from '$lib/queries/shared';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    const errors = await getErrorCountPerType();

    return {
        errors: {
            databases: errors.databases > 0,
            storages: errors.storages > 0,
            executions: errors.executions > 0,
        },
    };
};
