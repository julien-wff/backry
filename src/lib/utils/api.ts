import type { ExecutionUpdateEventPayload } from '$lib/shared/events';
import { err, ok, ResultAsync } from 'neverthrow';

/**
 * Fetch API wrapper
 * @param method HTTP method
 * @param url URL to fetch
 * @param body Request body
 * @param createError Function to create error message in case the body is empty or unreadable, to match the type `E`
 * @returns ResultAsync with either the parsed response or an error
 * @template B Type of the request body
 * @template R Type of the response body
 * @template E Type of the error
 */
export async function fetchApi<B extends object, R extends object, E = string>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    body: B,
    createError: ((error: string) => E) = (e => e as E),
): Promise<ResultAsync<R, E>> {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    let response: R | { error: E } | null;
    try {
        response = await res.json();
    } catch {
        response = null;
    }

    if (response && 'error' in response && response.error) {
        return err(response.error);
    }

    if (!res.ok) {
        return err(createError(`Fetch error: ${res.status} ${res.statusText}`));
    }

    if (!response) {
        return err(createError('Fetch error: empty response'));
    }

    return ok(response as R);
}


export function subscribeApi<T extends ExecutionUpdateEventPayload>(endpoint: '/api/executions/subscribe', onChunk: (chunk: T) => void): () => void;
export function subscribeApi<T>(endpoint: string, onChunk: (chunk: T) => void): () => void {
    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data) as T;
            onChunk(data);
        } catch (error) {
            console.error('Error parsing SSE data:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
    };

    return () => {
        eventSource.close();
    };
}

