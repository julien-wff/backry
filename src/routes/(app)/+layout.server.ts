import { getErrorCountPerType, getWarningCountPerType } from '$lib/server/queries/shared';
import { getSettings } from '$lib/server/settings/settings';
import { areToolChecksSuccessful } from '$lib/server/shared/tool-checks';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    const [ errors, warnings, settings ] = await Promise.all([
        getErrorCountPerType(),
        getWarningCountPerType(),
        getSettings(),
    ]);

    if (!settings.setupComplete) {
        throw redirect(303, `/setup/${settings.setupCurrentStep}`);
    }

    return {
        errors: {
            databases: errors.databases,
            storages: errors.storages,
            backups: errors.backups,
            notifications: errors.notifications,
            tools: !areToolChecksSuccessful(),
        },
        warnings: {
            storages: warnings.storages,
        },
    };
};
