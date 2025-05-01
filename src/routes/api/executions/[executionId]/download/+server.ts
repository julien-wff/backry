import { getExecution } from '$lib/queries/executions';
import { readFileContent } from '$lib/storages/restic';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
    const executionId = parseInt(params.executionId || '');
    if (isNaN(executionId) || executionId < 0) {
        return json({ error: 'Invalid execution ID' }, { status: 400 });
    }

    const execution = await getExecution(executionId);
    if (!execution) {
        return json({ error: 'Execution not found' }, { status: 404 });
    }

    if (execution.error || !execution.finishedAt || !execution.snapshotId || !execution.dumpSize) {
        return json({ error: 'Execution is not in a successful state' }, { status: 400 });
    }

    if (execution.dumpSize > 10e6) {
        return json({ error: 'File too large to download' }, { status: 400 });
    }

    const storage = execution.jobDatabase.job.storage;
    const content = await readFileContent(
        storage.url,
        storage.password!,
        storage.env,
        execution.snapshotId,
        execution.fileName,
    );

    if (content.isErr()) {
        return json({ error: content.error.message }, { status: 500 });
    }

    return new Response(content.value.join('\n'), {
        status: 200,
        headers: {
            'Content-Type': 'application/sql',
            'Content-Disposition': `attachment; filename="${execution.fileName}"`,
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
        },
    });
};
