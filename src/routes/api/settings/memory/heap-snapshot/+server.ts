import type { RequestHandler } from './$types';
import { getHeapSnapshot } from 'node:v8';
import { logger } from '$lib/server/services/logger';
import { Readable } from 'node:stream';
import { formatDuration } from '$lib/helpers/format';

export const GET: RequestHandler = async () => {
    const start = Date.now();
    logger.info(`Heap snapshot requested`);

    const snapshot = getHeapSnapshot(
        { exposeInternals: true, exposeNumericValues: true },
    );

    logger.info(`Heap snapshot created in ${formatDuration((Date.now() - start) / 1000)}`);

    // ReadableStream of Response BodyInit is not the same as ReadableStream from Readable.toWeb
    const stream = Readable.toWeb(snapshot) as unknown as ReadableStream;

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="backry-heap-snapshot.heapsnapshot"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
        },
    });
};
