import { db } from '$lib/server/db';
import { RUN_ORIGIN, runs } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * Create a new run in the database.
 * @param origin The origin of the run (e.g. 'cron', 'manual').
 * @return The created run object.
 */
export const createRun = (origin: typeof RUN_ORIGIN[number]) =>
    db.insert(runs).values({ origin }).returning().get();

/**
 * Update a run in the database.
 */
export const updateRun = (id: number, payload: Partial<typeof runs.$inferInsert>) =>
    db.update(runs).set(payload).where(eq(runs.id, id)).returning().get();

export const runsListFull = () => db.query.runs.findMany({
    orderBy: (runs) => [ desc(runs.createdAt) ],
    with: {
        backups: {
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
        },
    },
});

/**
 * Get a run by its ID. Cnclude the associated backups and their relations.
 * @param id The ID of the run to get.
 * @return The run object, or undefined if not found.
 */
export const getRunFull = (id: number) => db.query.runs.findFirst({
    where: eq(runs.id, id),
    with: {
        backups: {
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
        },
    },
});

/**
 * Delete a run by its ID. This will also delete all associated backups by the foreign key constraint.
 * @param id The ID of the run to delete.
 * @return The deleted run object.
 */
export const deleteRun = (id: number) => db.delete(runs).where(eq(runs.id, id)).returning().get();
