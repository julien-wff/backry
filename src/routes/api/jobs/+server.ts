import { createJob } from '$lib/queries/jobs';
import type { JobsCreateRequest } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as JobsCreateRequest;
    const job = await createJob(body);
    return json(job, { status: 201 });
};
