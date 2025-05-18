import type { BackupUpdateEventPayload } from '$lib/shared/events';
import type { ApiResponse } from '$lib/types/api';
import { err, ok, ResultAsync } from 'neverthrow';
import { type z, type ZodSchema } from 'zod';

/**
 * Fetch API wrapper
 * @param method HTTP method
 * @param url URL to fetch
 * @param body Request body
 * @returns ResultAsync with either the parsed response or an error
 * @template R Type of the response body
 * @template B Zod schema for the request body, or null for empty body
 */
export async function fetchApi<R extends object, B extends ZodSchema | null>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    body: B extends ZodSchema ? z.infer<B> : null,
): Promise<ResultAsync<R, string>> {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    let response: ApiResponse<R> | null;
    try {
        response = await res.json();
    } catch {
        response = null;
    }

    if (response && response.error !== null) {
        return err(response.error);
    }

    if (!res.ok) {
        return err(`Fetch error: ${res.status} ${res.statusText}`);
    }

    if (!response) {
        return err('Fetch error: empty response');
    }

    return ok(response.data);
}


export function subscribeApi<T extends BackupUpdateEventPayload>(endpoint: '/api/backups/subscribe', onChunk: (chunk: T) => void): () => void;
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

