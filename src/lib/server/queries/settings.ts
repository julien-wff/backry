import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SETTINGS_ID = 1;

/**
 * Get the application settings from the database.
 * @return The application settings, or undefined if they do not exist.
 */
export const getSettings = () => db
    .query
    .settings
    .findFirst({ where: eq(settings.id, SETTINGS_ID) })
    .execute();

/**
 * Create default application settings in the database.
 * If they already exist, this will fail.
 * @return The created settings.
 */
export const createDefaultSettings = () => db
    .insert(settings)
    .values({ id: SETTINGS_ID })
    .returning()
    .then(([ setting ]) => setting);

/**
 * Update the application settings in the database.
 * @param changes The settings changes to apply.
 * @return The updated settings.
 */
export const updateSettings = (changes: Partial<Omit<typeof settings.$inferSelect, 'id' | 'updatedAt'>>) => db
    .update(settings)
    .set(changes)
    .where(eq(settings.id, SETTINGS_ID))
    .returning()
    .then(([ setting ]) => setting);
