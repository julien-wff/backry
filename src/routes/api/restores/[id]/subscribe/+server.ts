import type { RequestHandler } from './$types';
import { restoreEmitter, type RestoreUpdateEventPayload } from '$lib/server/shared/events';

export const GET: RequestHandler = async ({ params, request }) => {
    let cleanup = () => {
    };

    // TODO: find a solution to fix the cleanup function that is never called
    const stream = new ReadableStream({
        start(controller) {
            const onProgress = (data: RestoreUpdateEventPayload) => {
                // Only send events for the specific restore ID
                if (data.id !== Number(params.id)) {
                    return;
                }

                // Send the updated restore data as a stringified JSON object
                controller.enqueue('data: ' + JSON.stringify(data) + '\n\n');
            };
            restoreEmitter.on('update', onProgress);

            cleanup = () => {
                console.log('cleanup');
                restoreEmitter.off('update', onProgress);
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
