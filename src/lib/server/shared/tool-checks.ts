import { getAllEnginesVersionsOrError } from '$lib/server/databases/checks';
import { logger } from '$lib/server/services/logger';
import { getResticVersion } from '$lib/server/services/restic';

let _areToolChecksSuccessful = false;

/**
 * Store if there are errors while checking tools for interacting with databases.
 * @param successful True if there are no errors, false otherwise.
 */
export function setToolChecksSuccess(successful: boolean) {
    _areToolChecksSuccessful = successful;
}

/**
 * Get if there are errors while checking tools for interacting with databases.
 * @returns True if there are no errors, false otherwise.
 */
export function areToolChecksSuccessful() {
    return _areToolChecksSuccessful;
}

/**
 * Check if the CLI tools are available and working correctly, and update the internal state.
 * If any of them is not available or has an error, it sets the tool checks as unsuccessful.
 */
export async function computeToolChecksSuccess() {
    const [ resticVersion, enginesVersions ] = await Promise.all([
        getResticVersion(),
        getAllEnginesVersionsOrError(),
    ]);

    const areChecksSuccessful = resticVersion.isOk() && Object.values(enginesVersions).every(engine => !engine.error);
    if (!areChecksSuccessful) {
        logger.warn('One or more CLI tools are not available or not working correctly, please check /settings/tools.');
    } else {
        logger.debug('CLI tools check OK');
    }

    setToolChecksSuccess(areChecksSuccessful);
}
