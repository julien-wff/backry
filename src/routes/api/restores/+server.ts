import type { RequestHandler } from './$types';
import { parseRequestBody } from '$lib/server/schemas';
import { restoreRequest, type RestoreResponse } from '$lib/server/schemas/api';
import { apiError, apiSuccess } from '$lib/server/api/responses';
import { getBackup } from '$lib/server/queries/backups';
import { runRestoreBackup } from '$lib/server/restores/run-restore-backup';
import type { restores } from '$lib/server/db/schema';

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

    const restore = await new Promise<typeof restores.$inferSelect>(resolve => runRestoreBackup({
        backup,
        selectedDestination: body.value.destination,
        otherConnectionString: body.value.otherConnectionString,
        dropDatabase: body.value.dropDatabase,
        onRestoreCreated: resolve,
    }));

    return apiSuccess<RestoreResponse>(restore, 201);
};
