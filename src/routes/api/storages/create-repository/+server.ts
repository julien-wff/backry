import { initRepository } from '$lib/storages/restic';
import type { StoragesCreateRepositoryRequest, StoragesCreateRepositoryResponse } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as StoragesCreateRepositoryRequest;

    const res = await initRepository(
        body.url,
        body.password,
        body.env || {},
    );

    if (res.isErr()) {
        return json(
            {
                error: res.error,
                output: null,
            } as StoragesCreateRepositoryResponse,
            {
                status: 400,
            },
        );
    }

    return json(
        {
            error: null,
            output: res.value,
        } as StoragesCreateRepositoryResponse,
        {
            status: 200,
        },
    );
};
