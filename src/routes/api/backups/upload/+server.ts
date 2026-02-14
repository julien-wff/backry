import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$lib/server/api/responses';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { databases, jobs } from '$lib/server/db/schema';
import { createUploadSession } from '$lib/server/backups/upload-backup';
import { parseRequestBody } from '$lib/server/schemas';
import { backupUploadRequest } from '$lib/server/schemas/api';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, backupUploadRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const database = await db.query.databases.findFirst({
        where: eq(databases.id, body.value.databaseId),
    });
    if (!database) {
        return apiError(`Database ${body.value.databaseId} not found`);
    }

    const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, body.value.jobId),
    });
    if (!job) {
        return apiError(`Job ${body.value.jobId} not found`);
    }

    const session = await createUploadSession(job, database);
    if (session.isErr()) {
        return apiError(session.error);
    }

    return apiSuccess(session.value);
};
