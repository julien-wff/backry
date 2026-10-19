import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { settingsChangeRequest } from '#lib/server/schemas/api.ts';
import { testDockerConnection } from '#lib/server/services/docker.ts';
import { type Settings, updateSettings } from '#lib/server/settings/settings.ts';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, settingsChangeRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    if (body.value.dockerURI) {
        const checkResult = await testDockerConnection(body.value.dockerURI);

        if (checkResult.isErr()) {
            return apiError(
                `${checkResult.error.code}: ${checkResult.error.message}`,
                400,
            );
        }
    }

    const settings = await updateSettings(body.value);

    return apiSuccess<Settings>(settings, 200);
};
