import { getErrorCountPerType } from '$lib/server/queries/shared';
import { areToolChecksSuccessful } from '$lib/server/shared/tool-checks';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    const errors = await getErrorCountPerType();

    return {
        errors: {
            databases: errors.databases,
            storages: errors.storages,
            backups: errors.backups,
            notifications: errors.notifications,
            tools: !areToolChecksSuccessful(),
        },
    };
};
