import type { RequestHandler } from './$types';
import { writeHeapSnapshot } from 'node:v8';
import os from 'node:os';
import path from 'node:path';
import { logger } from '$lib/server/services/logger';
import dayjs from 'dayjs';

export const GET: RequestHandler = async () => {
    const start = dayjs();
    logger.info(`Heap snapshot requested`);

    const snapshotPath = writeHeapSnapshot(
        path.join(os.tmpdir(), `backry-heap-snapshot-${Date.now()}.heapsnapshot`),
        { exposeInternals: true, exposeNumericValues: true },
    );
    logger.info(`Heap snapshot created in ${dayjs().diff(start, 'second', true).toFixed(2)} seconds at ${snapshotPath}`);

    const file = Bun.file(snapshotPath);
    const content = new Blob([ await file.text() ], { type: 'application/octet-stream' });
    await file.delete();

    return new Response(content, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="backry-heap-snapshot.heapsnapshot"`,
            'Content-Length': content.size.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
        },
    });
};
