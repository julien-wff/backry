import { runCommandStream, runCommandSync, type StreamCommandOptions } from '$lib/server/services/cmd';
import { logger } from '$lib/server/services/logger';
import type {
    ResticBackupStatus,
    ResticBackupSummary,
    ResticError,
    ResticForget,
    ResticInit,
    ResticLock,
    ResticSnapshot,
    ResticStats,
} from '$lib/types/restic';
import { type $ } from 'bun';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export const RESTIC_CMD = process.env.BACKRY_RESTIC_CMD || 'restic';

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

/**
 * Take a Bun Shell command output from Restic and parse it into an array of passed type.
 * Each line will result in a separate element in the array.
 * @param res The result of the command
 * @param json If the output from stdout should be parsed as JSON. If one of the lines is not valid JSON, an error will be returned.
 * @param firstLines If set, only the first N lines will be parsed and returned.
 *                   This can be useful for e.g. for pruning, where only the first line is JSON.
 * @return The parsed output as an array of the passed type, or a Restic error (from the command or created from parsing error)
 * @template T The type of the stdout output lines
 */
async function resticCommandToResult<T>(
    res: Result<$.ShellOutput, $.ShellOutput>,
    json = true,
    firstLines: number = Number.MAX_SAFE_INTEGER,
): Promise<ResultAsync<T[], ResticError>> {
    if (res.isErr()) {
        logger.error(`Failed to run restic command: ${res.error.stderr.toString().trim()}`);
        return err(formatResticError(res.error));
    }

    const output = res.value.text().trim().split('\n').filter((line) => line.length > 0);
    if (!json) {
        return ok(output as T[]);
    }

    try {
        return ok(output.slice(0, firstLines).map(o => JSON.parse(o)) as T[]);
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
    const res = await runCommandSync(RESTIC_CMD, [ 'version' ]);
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
        RESTIC_CMD,
        [ 'stats', '-r', path, '--json', '--no-lock', '--mode', 'raw-data', ...(onlyBackry ? [ '--tag', 'backry' ] : []) ],
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
        RESTIC_CMD,
        [ 'snapshots', '-r', path, '--json', '--no-lock', ...(onlyBackry ? [ '--tag', 'backry' ] : []) ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticSnapshot[]>(res);
}


export async function initRepository(path: string, password: string, env: Record<string, string>) {
    const res = await runCommandSync(
        RESTIC_CMD,
        [ 'init', '-r', path, '--json' ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticInit>(res);
}

type BackupFromCommandExtras = Pick<
    StreamCommandOptions<ResticBackupSummary | ResticBackupStatus, ResticError>,
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
        RESTIC_CMD,
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
        RESTIC_CMD,
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


export async function getRepositoryLocks(url: string,
                                         password: string,
                                         env: Record<string, string>): Promise<ResultAsync<ResticLock[], string>> {
    const locksResult = await runCommandSync(
        RESTIC_CMD,
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
            RESTIC_CMD,
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
        RESTIC_CMD,
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


/**
 * Apply a forget policy to delete snapshots from a repository.
 * The snapshots are filtered by the tags `backry`, `jobId:<jobId>` and `dbId:<databaseId>`.
 * The policy is passed as a string to the `restic forget` command.
 * The reposotory is also pruned to definitely delete the data.
 * @param url URL to the restic repository
 * @param password Repository password
 * @param env Additional environment variables to set
 * @param policy Policy to apply (e.g. --keep-last 10). This is passed as a string to the `restic forget` command.
 * @param jobId Job ID to filter the snapshots by.
 * @param databaseId Database ID to filter the snapshots by.
 */
export async function applyForgetPolicy(url: string,
                                        password: string,
                                        env: Record<string, string>,
                                        policy: string,
                                        jobId: number,
                                        databaseId: number) {
    const res = await runCommandSync(
        RESTIC_CMD,
        [
            '-r', url,
            'forget',
            '--json',
            '--tag', 'backry',
            '--tag', `jobId:${jobId}`,
            '--tag', `dbId:${databaseId}`,
            '--prune',
            ...policy.split(' '),
        ],
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        },
    );

    return resticCommandToResult<ResticForget[]>(res, true, 1);
}


/**
 * Stream the content of a file from a restic repository.
 * This uses the `restic dump` command to stream the file content directly to the HTTP response.
 * If the Restic download is faster than the user can read the data, it will buffer in memory.
 * @param url URL to the restic repository
 * @param password Repository password
 * @param env Additional environment variables to set
 * @param snapshotId Snapshot ID to download the file from
 * @param fileName Name of the file to download from the snapshot
 * @return A ReadableStream that streams the file content, and a Promise that resolves when the process exits.
 */
export async function streamFileContent(url: string,
                                        password: string,
                                        env: Record<string, string>,
                                        snapshotId: string,
                                        fileName: string) {
    // Spawn restic dump and stream stdout directly to the HTTP response to avoid buffering the whole file in memory.
    const subprocess = Bun.spawn([
        RESTIC_CMD,
        '-r', url,
        '--no-lock',
        'dump',
        snapshotId,
        fileName,
    ], {
        env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        stdout: 'pipe',
        stderr: 'pipe',
    });

    const stdoutReader = subprocess.stdout.getReader();
    const stderrReader = subprocess.stderr.getReader();
    const stderrChunks: Uint8Array[] = [];

    // Collect stderr asynchronously (without blocking streaming of stdout)
    void (async () => {
        try {
            while (true) {
                const { done, value } = await stderrReader.read();
                if (done) break;
                if (value) stderrChunks.push(value);
            }
        } finally {
            try {
                stderrReader.releaseLock();
            } catch (e) {
                logger.warn(e, 'Failed to release stderr reader lock');
            }
        }
    })();

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            const { done, value } = await stdoutReader.read();
            if (done) {
                try {
                    stdoutReader.releaseLock();
                } catch (e) {
                    logger.warn(e, 'Failed to release stdout reader lock');
                }
                controller.close();
                return;
            }
            if (value) controller.enqueue(value);
        },
        cancel() {
            try {
                subprocess.kill();
            } catch {
                /* ignore */
            }
        },
    });

    // Promise resolves when process exits; if non-zero we format error message
    const exitPromise = (async (): Promise<Result<void, ResticError>> => {
        const exitCode = await subprocess.exited;
        if (exitCode !== 0) {
            // Attempt to parse stderr as restic JSON error, else fallback to raw text
            const stderrText = (await new Blob(stderrChunks as BlobPart[]).text()).trim();
            try {
                return err(JSON.parse(stderrText));
            } catch {
                return err({
                    message_type: 'unknown',
                    code: exitCode,
                    message: stderrText,
                } as ResticError);
            }
        }
        return ok();
    })();

    return { stream, exitPromise };
}


/**
 * Read the content of a file from a restic repository and pipe it to a command.
 * The command output is collected and returned as a string.
 * This can be used to e.g. pipe a SQL dump file to a database client command to restore it.
 * @remarks
 * The command is run synchronously and the full output is collected in memory.
 * @param url URL to the restic repository
 * @param password Repository password
 * @param env Additional environment variables to set
 * @param snapshotId Snapshot ID to download the file from
 * @param fileName Name of the file to download from the snapshot
 * @param command Command to run, with arguments as separate array elements
 * @return The command output as a string, or a Restic error
 */
export async function pipeFileContentToCommand(url: string,
                                               password: string,
                                               env: Record<string, string>,
                                               snapshotId: string,
                                               fileName: string,
                                               command: string[]): Promise<Result<string, ResticError>> {
    const res = await pipeCommandSync(
        RESTIC_CMD,
        [
            '-r', url,
            '--no-lock',
            '--quiet',
            'dump',
            snapshotId,
            fileName,
        ],
        command[0],
        command.slice(1),
        {
            env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env },
        },
    );

    if (res.isErr()) {
        return err(formatResticError(res.error));
    }

    return ok(res.value.text().trim());
}
