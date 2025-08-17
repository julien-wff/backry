import type { RequestHandler } from './$types';
import { writeHeapSnapshot } from 'node:v8';
import os from 'node:os';

export const GET: RequestHandler = async () => {
    const snapshotPath = writeHeapSnapshot(
        os.tmpdir() + '/backry-heap-snapshot-' + Date.now() + '.heapsnapshot',
        { exposeInternals: true, exposeNumericValues: true },
    );

    const file = Bun.file(snapshotPath);
    const content = new Blob([ await file.text() ]);
    await file.delete();

    return new Response(content, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="backry-heap-snapshot.heapsnapshot"`,
        },
    });
};
