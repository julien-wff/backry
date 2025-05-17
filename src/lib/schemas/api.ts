import { DATABASE_ENGINES } from '$lib/db/schema';
import { z } from 'zod';

/** `POST /api/databases/check` */
export const databasesCheckRequest = z.object({
    connectionString: z.string().nonempty(),
    engine: z.enum(DATABASE_ENGINES),
});

export type DatabasesCheckRequest = z.infer<typeof databasesCheckRequest>;
