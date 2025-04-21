import { runCommandSync } from '$lib/utils/cmd';
import { type ShellOutput } from 'bun';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export interface ResticError {
    message_type: string;
    code: number;
    message: string;
}

export interface ResticStats {
    message_type: 'stats';
    total_size: number;
    total_file_count: number;
    total_blob_count: number;
    snapshots_count: number;
    total_uncompressed_size: number;
    compression_ratio: number;
    compression_progress: number;
    compression_space_saving: number;
}

export interface ResticInit {
    message_type: 'initialized';
    id: string;
    repository: string;
}

export interface ResticBackupStatus {
    message_type: 'status',
    seconds_remaining?: number,
    percent_done: number,
    total_files: number,
    files_done?: number,
    bytes_done?: number,
    current_files?: string[],
}

export interface ResticBackupSummary {
    message_type: 'summary',
    files_new: number,
    files_changed: number,
    files_unmodified: number,
    dirs_new: number,
    dirs_changed: number,
    dirs_unmodified: number,
    data_blobs: number,
    tree_blobs: number,
    data_added: number,
    data_added_packed: number,
    total_files_processed: number,
    total_bytes_processed: number,
    total_duration: number,
    backup_start: string,
    backup_end: string,
    snapshot_id: string,
}

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
    } catch (e) {
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
    } catch (e) {
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
