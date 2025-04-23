import { addOrUpdateCronJob } from '$lib/cron';
import { checkAllActiveDatabases } from '$lib/engines/checks';
import { setUnfinishedExecutionsToError } from '$lib/queries/executions';
import { checkAllActiveRepositories } from '$lib/storages/checks';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
    addOrUpdateCronJob('system:check-storages',
        '* * * * *',
        () => checkAllActiveRepositories(),
    );

    addOrUpdateCronJob(
        'system:check-dbs',
        '* * * * *',
        () => checkAllActiveDatabases(),
    );

    await setUnfinishedExecutionsToError();
};
