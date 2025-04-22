import type { ResticBackupStatus, ResticBackupSummary, ResticError, ResticInit, ResticStats } from '$lib/types/restic';
import { runCommandSync } from '$lib/utils/cmd';
import { type ShellOutput } from 'bun';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export const RESTIC_DEFAULT_ENV = {
    'RESTIC_CACHE_DIR': process.env.RESTIC_CACHE_DIR ?? '',
    'XDG_CACHE_DIR': process.env.XDG_CACHE_DIR ?? '',
    'HOME': process.env.HOME ?? '',
    'LOCALAPPDATA': process.env.LOCALAPPDATA ?? '',
};

function formatResticError(shellOutput: ShellOutput) {
    const error = shellOutput.stderr.toString().trim();
    try {
        return JSON.parse(error) as ResticError;
    } catch {
        return {
            message_type: 'unknown',
            code: -1,
            message: error,
        };
    }
}

async function resticCommandToResult<T>(res: Result<ShellOutput, ShellOutput>): Promise<ResultAsync<T[], ResticError>> {
    if (res.isErr()) {
        return err(formatResticError(res.error));
    }

    const output = res.value.text().trim().split('\n').filter((line) => line.length > 0);
    try {
        return ok(output.map(o => JSON.parse(o)) as T[]);
    } catch {
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


export async function getRepositoryStats(path: string, password: string, env: Record<string, string>) {
    const res = await runCommandSync(
        'restic',
        [ 'stats', '-r', path, '--json' ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticStats>(res);
}


export async function initRepository(path: string, password: string, env: Record<string, string>) {
    const res = await runCommandSync(
        'restic',
        [ 'init', '-r', path, '--json' ],
        { env: { RESTIC_PASSWORD: password, ...RESTIC_DEFAULT_ENV, ...env } },
    );

    return resticCommandToResult<ResticInit>(res);
}


export async function backupFromCommand(url: string,
                                        password: string,
                                        env: Record<string, string>,
                                        command: string[],
                                        fileName: string,
                                        tags: string[]) {
    tags = [ 'backry', ...tags.map((tag) => tag.replace(/,/g, '_')) ];

    const res = await runCommandSync(
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
        },
    );

    return resticCommandToResult<ResticBackupStatus | ResticBackupSummary>(res);
}
