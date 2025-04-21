import { executionsListFull } from '$lib/queries/executions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const executions = await executionsListFull();

    return {
        executions,
    };
};
