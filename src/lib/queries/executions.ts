import { db } from '$lib/db';
import { executions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const executionsListFull = async () => db.query.executions.findMany({
    with: {
        jobDatabase: {
            with: {
                database: true,
                job: {
                    with: {
                        storage: true,
                    },
                },
            },
        },
    },
});

export const createExecution = async (jobDatabaseId: number) =>
    db
        .insert(executions)
        .values({
            jobDatabaseId: jobDatabaseId,
        })
        .returning()
        .get();

export const updateExecution = async (id: number, payload: Partial<typeof executions.$inferInsert>) =>
    db
        .update(executions)
        .set(payload)
        .where(eq(executions.id, id))
        .returning()
        .get();
