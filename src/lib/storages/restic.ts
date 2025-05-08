import type {
    ResticBackupStatus,
    ResticBackupSummary,
    ResticError,
    ResticInit,
    ResticLock,
    ResticSnapshot,
    ResticStats,
} from '$lib/types/restic';
import { runCommandStream, runCommandSync, type StreamCommandOptions } from '$lib/utils/cmd';
import { logger } from '$lib/utils/logger';
import { type $ } from 'bun';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export const RESTIC_DEFAULT_ENV = {
    'RESTIC_CACHE_DIR': process.env.RESTIC_CACHE_DIR ?? '',
    'XDG_CACHE_DIR': process.env.XDG_CACHE_DIR ?? '',
    'HOME': process.env.HOME ?? '',
    'LOCALAPPDATA': process.env.LOCALAPPDATA ?? '',
};

function formatResticError(shellOutput: $.ShellOutput) {
    const error = shellOutput.stderr.toString().trim();
    try {
        return JSON.parse(error) as ResticError;
    } catch {
        logger.error(`Failed to parse restic error: ${error}`);
        return {
            message_type: 'unknown',
            code: -1,
            message: error,
        };
    }
}

async function resticCommandToResult<T>(res: Result<$.ShellOutput, $.ShellOutput>, json = true): Promise<ResultAsync<T[], ResticError>> {
    if (res.isErr()) {
        logger.error(`Failed to run restic command: ${res.error.stderr.toString().trim()}`);
        return err(formatResticError(res.error));
    }

    const output = res.value.text().trim().split('\n').filter((line) => line.length > 0);
    if (!json) {
        return ok(output as T[]);
    }

    try {
        return ok(output.map(o => JSON.parse(o)) as T[]);
    } catch {
        logger.error(`Failed to parse restic output: ${res.value.text().trim()}`);
        return err({
            message_type: 'unknown',
            code: -1,
            message: res.value.text().trim(),
        });
    }
}


export async function getResticVersion(): Promise<ResultAsync<string, string>> {
    const res = await runCommandSync('restic', [ 'version' ]);
    if (res.isErr()) {
        return err(res.error.stderr.toString().trim());
    }

    return ok(res.value.text().trim());
}


/**
 * Get the raw statistics of a restic repository.
 * @param path URL to the restic repository
 * @param password Repository password
 * @param env Additional environment variables to set
 * @param onlyBackry If true, only include snapshots from backry
 */
export async function getRepositoryStats(path: string, password: string, env: Record<string, string>, onlyBackry = false) {
    const res = await runCommandSync(
        'restic',
        [ 'stats', '-r', path, '--json', '--mode', 'raw-data', ...(onlyBackry ? [ '--tag', 'backry' ] : []) ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticStats>(res);
}


/**
 * Get the list of all snapshots in a restic repository.
 * @param path URL to the restic repository
 * @param password Repository password
 * @param env Additional environment variables to set
 * @param onlyBackry If true, only include snapshots from backry (with the `backry` tag)
 * @return An array with a single element being the complete list of snapshots
 */
export async function getRepositorySnapshots(path: string, password: string, env: Record<string, string>, onlyBackry = false) {
    const res = await runCommandSync(
        'restic',
        [ 'snapshots', '-r', path, '--json', '--no-lock', ...(onlyBackry ? [ '--tag', 'backry' ] : []) ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticSnapshot[]>(res);
}


export async function initRepository(path: string, password: string, env: Record<string, string>) {
    const res = await runCommandSync(
        'restic',
        [ 'init', '-r', path, '--json' ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticInit>(res);
}

type BackupFromCommandExtras = Pick<
    StreamCommandOptions<ResticBackupSummary | ResticBackupStatus, string>,
    'onStdout' | 'onStderr'
>;

export async function backupFromCommand(url: string,
                                        password: string,
                                        env: Record<string, string>,
                                        command: string[],
                                        fileName: string,
                                        tags: string[],
                                        extras: BackupFromCommandExtras = {}) {
    tags = [ 'backry', ...tags.map((tag) => tag.replace(/,/g, '_')) ];

    return runCommandStream(
        'restic',
        [
            '-r', url,
            'backup',
            '--json',
            '--tag', tags.join(','),
            '--stdin-filename', fileName,
            '--stdin-from-command', '--', ...command,
        ],
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
            json: true,
            ...extras,
        },
    );
}


/**
 * Delete snapshots from a restic repository using `forget --prune`.
 * @param url URL to the restic repository
 * @param password Repository password
 * @param env Additional environment variables to set
 * @param snapshots List of snapshot IDs to delete
 * @return Full CLI text output from restic
 */
export async function deleteSnapshots(url: string,
                                      password: string,
                                      env: Record<string, string>,
                                      snapshots: string[]) {
    // forget with --prune does not yet support JSON output as of restic v0.18.0
    // https://restic.readthedocs.io/en/v0.18.0/075_scripting.html#forget
    const res = await runCommandSync(
        'restic',
        [
            '-r', url,
            'forget',
            '--prune',
            ...snapshots,
        ],
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        },
    );

    return resticCommandToResult<string>(res, false);
}


export async function readFileContent(url: string,
                                      password: string,
                                      env: Record<string, string>,
                                      snapshotId: string,
                                      fileName: string) {
    const res = await runCommandSync(
        'restic',
        [
            '-r', url,
            'dump',
            snapshotId,
            fileName,
        ],
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        },
    );

    return resticCommandToResult<string>(res, false);
}


export async function getRepositoryLocks(url: string,
                                         password: string,
                                         env: Record<string, string>): Promise<ResultAsync<ResticLock[], string>> {
    const locksResult = await runCommandSync(
        'restic',
        [
            '-r', url,
            'list',
            'locks',
            '--json',
            '--no-lock',
        ],
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        },
    );

    const locks = await resticCommandToResult<string>(locksResult, false);
    if (locks.isErr()) {
        return err(locks.error.message);
    }

    const locksData = await Promise.all(locks.value.map(async (lock) => {
        const lockResult = await runCommandSync(
            'restic',
            [
                '-r', url,
                'cat',
                'lock',
                lock,
                '--no-lock',
            ],
            {
                env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
            },
        );

        const res = await resticCommandToResult<string>(lockResult, false);
        if (res.isErr()) {
            return err(res.error.message);
        }
        return ok(JSON.parse(res.value.join('\n')) as ResticLock);
    }));

    const errors = locksData.filter((lock) => lock.isErr());
    if (errors.length > 0) {
        return err(errors[0].error);
    }

    const data = locksData
        .map((lock) => lock.unwrapOr(null))
        .filter((lock) => lock !== null);

    return ok(data);
}


export async function unlockRepository(url: string,
                                       password: string,
                                       env: Record<string, string>) {
    const res = await runCommandSync(
        'restic',
        [
            '-r', url,
            'unlock',
        ],
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        },
    );

    return resticCommandToResult<string>(res, false);
}
