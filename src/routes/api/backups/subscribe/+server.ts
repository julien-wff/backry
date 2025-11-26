import { backupEmitter } from '$lib/server/shared/events';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
    let cleanup = () => {
    };

    const stream = new ReadableStream({
        start(controller) {
            const onProgress = (data: any) => {
                controller.enqueue('data: ' + JSON.stringify(data) + '\n\n');
            };
            backupEmitter.on('update', onProgress);

            cleanup = () => {
                backupEmitter.off('update', onProgress);
                controller.close();
            };

            request.signal.addEventListener('abort', cleanup, { once: true });
            return cleanup;
        },
        cancel() {
            cleanup();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'X-Accel-Buffering': 'no',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
};
