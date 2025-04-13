import { runCommandSync } from '$lib/utils/cmd';
import type { ShellOutput } from 'bun';
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

async function resticCommandToResult<T>(res: Result<ShellOutput, ShellOutput>): Promise<ResultAsync<T, ResticError>> {
    if (res.isErr()) {
        return err(formatResticError(res.error));
    }

    const output = res.value.text().trim();
    try {
        return ok(JSON.parse(output) as T);
    } catch (e) {
        return err({
            message_type: 'unknown',
            code: -1,
            message: output,
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
        { env: { RESTIC_PASSWORD: password, ...env } },
    );

    return resticCommandToResult<ResticStats>(res);
}


export async function initRepository(path: string, password: string, env: Record<string, string>) {
    const res = await runCommandSync(
        'restic',
        [ 'init', '-r', path, '--json' ],
        { env: { RESTIC_PASSWORD: password, ...env } },
    );

    return resticCommandToResult<ResticInit>(res);
}
