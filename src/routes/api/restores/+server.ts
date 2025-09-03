import type { RequestHandler } from './$types';
import { parseRequestBody } from '$lib/server/schemas';
import { restoreRequest } from '$lib/server/schemas/api';
import { apiError } from '$lib/server/api/responses';
import { getBackup } from '$lib/server/queries/backups';
import { runRestoreBackup } from '$lib/server/restores/run-restore-backup';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, restoreRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const backup = await getBackup(body.value.backupId);
    if (!backup) {
        return apiError('Backup not found', 404);
    }

    if (backup.error || !backup.dumpSize || backup.prunedAt) {
        return apiError('Backup is not valid for restore', 400);
    }

    await runRestoreBackup({
        backup,
        selectedDestination: body.value.destination,
        otherConnectionString: body.value.otherConnectionString,
        dropDatabase: body.value.dropDatabase,
    });

    return new Response();
};
