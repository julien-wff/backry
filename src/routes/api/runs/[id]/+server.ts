import { apiError, apiSuccess } from '$lib/server/api/responses';
import { deleteRun, getRunFull } from '$lib/server/queries/runs';
import type { RunResponse } from '$lib/server/schemas/api';
import { deleteSnapshots } from '$lib/server/services/restic';
import { type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const runId = parseInt(params.id || '');
    if (isNaN(runId) || runId < 0) {
        return apiError('Invalid run ID', 400);
    }

    // Get the run to delete
    const run = await getRunFull(runId);
    if (!run) {
        return apiError('Run not found', 404);
    }

    // Check if the run is finished
    if (!run.finishedAt) {
        return apiError('Run not finished', 400);
    }

    // If there are backup associated, check if all are finished and delete their files from Restic
    if (run.backups.length > 0) {
        if (run.backups.some(backup => !backup.error && !backup.finishedAt)) {
            return apiError('Some backups are not finished', 400);
        }

        const storage = run.backups[0].jobDatabase.job.storage;
        const snapshots = run.backups.map(backup => backup.snapshotId).filter(id => id !== null);
        if (snapshots.length > 0) {
            const res = await deleteSnapshots(storage.url, storage.password!, storage.env, snapshots);
            if (res.isErr()) {
                return apiError(res.error.message, 500);
            }
        }
    }

    // Delete the run (the backups are deleted automatically by the foreign key constraint)
    const deletedRun = deleteRun(runId);
    return apiSuccess<RunResponse>(deletedRun!);
};
