import { parseIdOrNewParam } from '$lib/server/api/params';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getBackup } from '$lib/server/queries/backups';

export const load: PageServerLoad = async ({ params }) => {
    const { id } = parseIdOrNewParam(params.backupId);
    if (id === null) {
        return error(400, 'Invalid backup ID');
    }

    let backup = await getBackup(id);
    if (!backup) {
        return error(404, 'Backup not found');
    }

    if (backup.error) {
        return error(400, 'Backup is in an error state and cannot be restored');
    }

    if (backup.prunedAt) {
        return error(400, 'Backup has been pruned and cannot be restored');
    }

    if (!backup.dumpSize) {
        return error(400, `Backup has an invalid dump size (${backup.dumpSize}) and cannot be restored`);
    }

    return {
        backup,
    };
};
