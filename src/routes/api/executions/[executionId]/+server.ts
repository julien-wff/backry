import { deleteExecution, getExecution } from '$lib/queries/executions';
import { deleteSnapshot } from '$lib/storages/restic';
import { json, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const executionId = parseInt(params.executionId || '');
    if (isNaN(executionId) || executionId < 0) {
        return json({ error: 'Invalid execution ID' }, { status: 400 });
    }

    const execution = await getExecution(executionId);
    if (!execution) {
        return json({ error: 'Execution not found' }, { status: 404 });
    }

    if (!execution.finishedAt) {
        return json({ error: 'Execution is not finished' }, { status: 400 });
    }

    // Delete from restic if completed
    const storage = execution.jobDatabase.job.storage;
    if (execution.snapshotId) {
        const res = await deleteSnapshot(storage.url, storage.password!, storage.env, execution.snapshotId);
        if (res.isErr()) {
            return json({ error: res.error.message }, { status: 500 });
        }
    }

    const res = await deleteExecution(executionId);
    return json(res);
};
