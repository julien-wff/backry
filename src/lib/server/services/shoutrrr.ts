import { runCommandSync } from '$lib/server/services/cmd';
import { logger } from '$lib/server/services/logger';
import { err, ok, type Result } from 'neverthrow';


export const SHOUTRRR_CMD = process.env.BACKRY_SHOUTRRR_CMD || 'shoutrrr';

/**
 * Sends a notification using Shoutrrr.
 * @param url Shoutrrr URL to send the notification to.
 * @param body The message body to send.
 * @param title Optional title for the notification (if supported by the service).
 * @see https://nicholas-fedor.github.io/shoutrrr/
 */
export async function sendShoutrrrNotification(url: string, body: string, title: string | null): Promise<Result<void, string>> {
    const res = await runCommandSync(
        SHOUTRRR_CMD,
        [ 'send', url, '-m', body, '-t', title ?? 'Backry' ],
    );

    if (res.isErr()) {
        const error = res.error.stderr.toString().trim();
        logger.error(`Failed to send Shoutrrr notification: ${error}`);
        return err(error);
    }

    return ok();
}


/**
 * Gets the version of Shoutrrr.
 * @returns The version of Shoutrrr, or an error if it could not be determined.
 * @see https://nicholas-fedor.github.io/shoutrrr/
 */
export async function getShoutrrrVersion(): Promise<Result<string, string>> {
    const res = await runCommandSync(
        SHOUTRRR_CMD,
        [ '--version' ],
    );

    if (res.isErr()) {
        const error = res.error.stderr.toString().trim();
        logger.error(`Failed to get Shoutrrr version: ${error}`);
        return err(error);
    }

    const version = res.value.stdout.toString().trim();
    return ok(version);
}
