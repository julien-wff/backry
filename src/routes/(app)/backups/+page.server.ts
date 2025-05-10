import { backupsListFull } from '$lib/queries/backups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const backups = await backupsListFull();

    return {
        backups,
    };
};
