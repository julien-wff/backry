import type { ApiResponse } from '$lib/server/api/responses';
import type { BackupUpdateEventPayload, RestoreUpdateEventPayload } from '$lib/server/shared/events';
import { err, ok, type Result } from 'neverthrow';
import type { z, ZodType } from 'zod';

/**
 * Fetch API wrapper
 * @param method HTTP method
 * @param url URL to fetch
 * @param body Request body
 * @returns Result with either the parsed response or an error
 * @template R Type of the response body
 * @template B Zod schema for the request body, or null for empty body
 */
export async function fetchApi<R extends object, B extends ZodType | null = null>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    body: B extends ZodType ? z.infer<B> : null,
): Promise<Result<R, string>> {
    const res = await fetch(url, {
        method,
        ...(method !== 'GET' && body && {
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }),
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
export function subscribeApi<T extends RestoreUpdateEventPayload>(endpoint: `/api/restores/${number}/subscribe`, onChunk: (chunk: T) => void): () => void;
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


/**
 * Upload a file in chunks to the server
 * @param url API endpoint to upload the file to
 * @param file File to upload
 * @param onProgress Optional callback to track upload progress, receives uploaded bytes and total bytes
 * @param signal Optional AbortSignal to cancel the upload
 * @param chunkSize Size of each chunk in bytes (default: 5 MB)
 * @returns Result indicating success or error message
 */
export async function uploadFileInChunks(
    url: string,
    file: File,
    onProgress?: (uploadedBytes: number, totalBytes: number) => void,
    signal?: AbortSignal,
    chunkSize = 5 * 1024 * 1024, // 5 MB
): Promise<Result<void, string>> {
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (signal?.aborted) {
            return err('Upload aborted');
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);

        try {
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
                signal,
            });

            let response: ApiResponse<{}> | null;
            try {
                response = await res.json();
            } catch {
                response = null;
            }

            if (response && response.error !== null) {
                return err(response.error);
            }

            if (!res.ok) {
                return err(`Upload failed at chunk ${chunkIndex + 1}/${totalChunks}`);
            }

            onProgress?.(end, file.size);
        } catch (e) {
            return err((e as Error).message);
        }
    }

    return ok();
}
