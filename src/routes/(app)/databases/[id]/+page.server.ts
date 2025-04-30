import { DATABASE_ENGINES } from '$lib/db/schema';
import { engines } from '$lib/engines';
import { createDatabase, getDatabase, updateDatabase } from '$lib/queries/databases';
import { parseIdOrNewParam } from '$lib/utils/params';
import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { id, isNew } = parseIdOrNewParam(params.id);
    if (id === null && !isNew) {
        return error(400, 'Invalid database ID');
    }

    let database: Awaited<ReturnType<typeof getDatabase>> | null = null;
    if (id !== null) {
        database = await getDatabase(id);
        if (!database) {
            return error(404, 'Database not found');
        }
    }

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
        database,
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

        const { id, isNew } = parseIdOrNewParam(params.id);
        if (id === null && !isNew) {
            return fail(400, { error: 'Invalid database ID' });
        }

        if (isNew) {
            createDatabase(data);
        } else if (id !== null) {
            const db = updateDatabase(id, data);
            if (!db) {
                return fail(404, { error: 'Database not found' });
            }
        }

        return redirect(307, '/databases');
    },
} satisfies Actions;
