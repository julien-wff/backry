import { apiError, apiSuccess } from '$lib/server/api/responses';
import { parseRequestBody } from '$lib/server/schemas';
import { settingsChangeRequest } from '$lib/server/schemas/api';
import { testDockerConnection } from '$lib/server/services/docker';
import { type Settings, updateSettings } from '$lib/server/settings/settings';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, settingsChangeRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    if (body.value.dockerURI) {
        const checkResult = await testDockerConnection(body.value.dockerURI);

        if (checkResult.isErr()) {
            return apiError(`${checkResult.error.code}: ${checkResult.error.message}`, 400);
        }
    }

    const settings = await updateSettings(body.value);

    return apiSuccess<Settings>(settings, 200);
};
