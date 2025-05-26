import { runCommandSync } from '$lib/server/services/cmd';
import { err, ok, type ResultAsync } from 'neverthrow';


export const SHOUTRRR_CMD = process.env.BACKRY_SHOUTRRR_CMD || 'shoutrrr';

/**
 * Sends a notification using Shoutrrr.
 * @param url Shoutrrr URL to send the notification to.
 * @param body The message body to send.
 * @see https://nicholas-fedor.github.io/shoutrrr/
 */
export async function sendShoutrrrNotification(url: string, body: string): Promise<ResultAsync<void, string>> {
    const res = await runCommandSync(
        SHOUTRRR_CMD,
        [ 'send', url, '-m', body ],
    );

    if (res.isErr()) {
        return err(res.error.stderr.toString().trim());
    }

    return ok();
}


/**
 * Gets the version of Shoutrrr.
 * @returns The version of Shoutrrr, or an error if it could not be determined.
 * @see https://nicholas-fedor.github.io/shoutrrr/
 */
export async function getShoutrrrVersion(): Promise<ResultAsync<string, string>> {
    const res = await runCommandSync(
        SHOUTRRR_CMD,
        [ '--version' ],
    );

    if (res.isErr()) {
        return err(res.error.stderr.toString().trim());
    }

    const version = res.value.stdout.toString().trim();
    return ok(version);
}
