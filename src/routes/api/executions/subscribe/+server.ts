import { executionEmitter } from '$lib/shared/events';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
    let cleanup = () => {
    };

    // TODO: find a solution to fix the cleanup function that is never called
    const stream = new ReadableStream({
        start(controller) {
            const onProgress = (data: any) => {
                controller.enqueue('data: ' + JSON.stringify(data) + '\n\n');
            };
            executionEmitter.on('update', onProgress);

            cleanup = () => {
                console.log('cleanup');
                executionEmitter.off('update', onProgress);
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
