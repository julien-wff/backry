import { db } from '$lib/db';
import { RUN_ORIGIN, runs } from '$lib/db/schema';

/**
 * Create a new run in the database.
 * @param origin The origin of the run (e.g. 'cron', 'manual').
 * @return The created run object.
 */
export const createRun = (origin: typeof RUN_ORIGIN[number]) =>
    db.insert(runs).values({ origin }).returning().get();
