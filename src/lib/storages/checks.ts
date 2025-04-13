import fs from 'fs/promises';
import { err, ok, type ResultAsync } from 'neverthrow';
import path from 'path';

export interface CheckPathResult {
    error: null;
    isEmpty: boolean;
    path: string;
}

export interface CheckPathError {
    error: string;
    path?: string;
}

export async function checkPath(rawPath: string | null): Promise<ResultAsync<CheckPathResult, CheckPathError>> {
    if (!rawPath) {
        return err({ error: 'path is required' });
    }

    const resolvedPath = path.resolve(rawPath);

    // Check if folder exists and is accessible
    try {
        await fs.access(resolvedPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (e) {
        return err(
            { error: `path is not accessible: ${(e as Error).message}`, path: resolvedPath },
        );
    }

    // Check if folder is empty
    const files = await fs.readdir(resolvedPath);

    return ok({
        error: null,
        isEmpty: files.length === 0,
        path: resolvedPath,
    });
}
