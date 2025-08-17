import type { RequestHandler } from './$types';
import { getHeapSnapshot } from 'node:v8';
import { logger } from '$lib/server/services/logger';
import dayjs from 'dayjs';
import { formatSize } from '$lib/helpers/format';

export const GET: RequestHandler = async () => {
    const start = dayjs();
    logger.info(`Heap snapshot requested`);

    const snapshot = getHeapSnapshot(
        { exposeInternals: true, exposeNumericValues: true },
    );
    const content = new Blob(await snapshot.toArray(), { type: 'application/octet-stream' });

    logger.info(`Heap snapshot created in ${dayjs().diff(start, 'second', true).toFixed(2)} seconds, ${formatSize(content.size)}`);

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
