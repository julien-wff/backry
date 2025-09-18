import { db } from '$lib/server/db';
import { restores } from '$lib/server/db/schema';
import { desc, eq, isNull, sql } from 'drizzle-orm';

export const getRestoreFull = (id: number) => db
    .query
    .restores
    .findFirst({
        with: {
            backup: {
                with: {
                    jobDatabase: {
                        with: {
                            job: {
                                with: {
                                    storage: true,
                                },
                            },
                            database: true,
                        },
                    },
                },
            },
        },
        where: eq(restores.id, id),
    });

export const getAllRestoresFull = () => db
    .query
    .restores
    .findMany({
        orderBy: desc(restores.createdAt),
        with: {
            backup: {
                with: {
                    jobDatabase: {
                        with: {
                            job: {
                                with: {
                                    storage: true,
                                },
                            },
                            database: true,
                        },
                    },
                },
            },
        },
    });

export const createRestore = (val: typeof restores.$inferInsert) => db
    .insert(restores)
    .values(val)
    .returning()
    .get();

export const updateRestore = (id: number, val: Partial<typeof restores.$inferInsert>) => db
    .update(restores)
    .set(val)
    .where(eq(restores.id, id))
    .returning()
    .get();

export const setRestoreToFinished = (id: number, logs: string | null = null) => db
    .update(restores)
    .set({ finishedAt: sql`(CURRENT_TIMESTAMP)`, restoreLogs: logs })
    .where(eq(restores.id, id))
    .returning()
    .get();

export const setUnfinishedRestoresToError = async () => db
    .update(restores)
    .set({
        error: 'Restore interrupted by Backry shutdown',
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
    })
    .where(isNull(restores.finishedAt))
    .returning()
    .get();
