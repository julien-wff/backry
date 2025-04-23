import { db } from '$lib/db';
import { executions } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const executionsListFull = async () => db.query.executions.findMany({
    orderBy: [ desc(executions.startedAt) ],
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

export const getExecution = async (id: number) =>
    db.query.executions.findFirst({
        where: eq(executions.id, id),
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

export const deleteExecution = async (id: number) =>
    db
        .delete(executions)
        .where(eq(executions.id, id))
        .returning()
        .get();

export const createExecution = async (jobDatabaseId: number, fileName: string) =>
    db
        .insert(executions)
        .values({
            jobDatabaseId,
            fileName,
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
