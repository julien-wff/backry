import { parseIdOrNewParam } from '$lib/server/api/params';
import { databasesList } from '$lib/server/queries/databases';
import { getJob } from '$lib/server/queries/jobs';
import { storagesList } from '$lib/server/queries/storages';
import { error } from '@sveltejs/kit';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import type { PageServerLoad } from './$types';

dayjs.extend(tz);

export const load: PageServerLoad = async ({ params }) => {
    const { id, isNew } = parseIdOrNewParam(params.id);
    if (id === null && !isNew) {
        return error(400, 'Invalid job ID');
    }

    let job: Awaited<ReturnType<typeof getJob>> | null = null;
    if (id !== null) {
        job = await getJob(id);
        if (!job) {
            return error(404, 'Job not found');
        }
    }

    const [ databases, storages ] = await Promise.all([
        databasesList(),
        storagesList(),
    ]);

    return {
        databases,
        storages,
        job,
        id,
        isNew,
        serverTimeZone: dayjs.tz.guess(),
    };
};
