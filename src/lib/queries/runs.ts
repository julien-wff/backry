import { db } from '$lib/db';
import { RUN_ORIGIN, runs } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

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
