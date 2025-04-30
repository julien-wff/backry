import { DATABASE_ENGINES } from '$lib/db/schema';
import { engines } from '$lib/engines';
import { createDatabase } from '$lib/queries/databases';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const engineList = Object.entries(engines).map(([ key, value ]) => {
        const engine = new value();
        return {
            id: key as typeof DATABASE_ENGINES[number],
            displayName: engine.displayName,
            icon: engine.icon,
            connectionStringPlaceholder: engine.connectionStringPlaceholder,
        };
    });

    return {
        engineList,
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

        const { data, error } = engineCreateSchema.safeParse(Object.fromEntries(formData));
        if (error) {
            return fail(401, { error: fromError(error).details });
        }

        createDatabase(data);
        return redirect(307, '/databases');
    },
} satisfies Actions;
