import { DATABASE_ENGINES } from '$lib/db/schema';
import { engines } from '$lib/engines';
import { createDatabase } from '$lib/queries/databases';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';

export const load: PageServerLoad = async ({ params }) => {
    const engine = params.engine as typeof DATABASE_ENGINES[number];

    if (!DATABASE_ENGINES.includes(engine)) {
        return redirect(307, '/databases');
    }

    const engineInstance = new engines[engine]();

    return {
        engine,
        engineName: engineInstance.displayName,
        connectionStringPlaceholder: engineInstance.connectionStringPlaceholder,
    };
};

const engineCreateSchema = z.object({
    engine: z.enum(DATABASE_ENGINES),
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    connectionString: z.string().min(2),
});

export const actions = {
    default: async ({ request, params }) => {
        const formData = await request.formData();
        formData.append('engine', params.engine);

        const { data, error } = engineCreateSchema.safeParse(Object.fromEntries(formData));
        if (error) {
            return fail(401, { error: fromError(error).details });
        }

        createDatabase(data);
        return redirect(307, '/databases');
    },
} satisfies Actions;
