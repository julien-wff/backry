import type { settings } from '$lib/server/db/schema';
import {
    createDefaultSettings,
    getSettings as getSettingsDb,
    updateSettings as updateSettingsQuery,
} from '$lib/server/queries/settings';
import { logger } from '$lib/server/services/logger';

export type Settings = Omit<typeof settings.$inferSelect, 'id' | 'updatedAt'>;

let settingsCache: Settings | null = null;

/**
 * Get the application settings, using the cache if available.
 * @return The application settings.
 */
export async function getSettings() {
    if (settingsCache) {
        return settingsCache;
    }

    return refreshSettingsCache();
}

/**
 * Refresh the settings cache from the database.
 * If no settings are found, create default settings.
 * @return The refreshed settings.
 */
export async function refreshSettingsCache() {
    let settingsRecord = await getSettingsDb();
    if (!settingsRecord) {
        logger.debug('No settings found, creating default settings');
        settingsRecord = await createDefaultSettings();
    }

    logger.debug(settingsRecord, 'Settings loaded');
    settingsCache = settingsRecord;
    return settingsCache;
}

/**
 * Update the application settings in the DB and refresh the cache.
 * @param changes The settings changes to apply.
 * @return The updated settings.
 */
export async function updateSettings(changes: Partial<Settings>) {
    const settings = { ...await getSettings(), ...changes } as Settings;
    settingsCache = await updateSettingsQuery(settings);
    return settingsCache;
}
