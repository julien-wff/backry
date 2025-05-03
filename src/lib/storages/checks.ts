import { db } from '$lib/db';
import { storages } from '$lib/db/schema';
import { getRepositoryStats } from '$lib/storages/restic';
import { eq, or } from 'drizzle-orm';
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

/**
 * Get information about a local path to check if it's accessible and empty.
 * @param rawPath The path to check, can be relative or absolute.
 * @returns A promise that resolves to a ResultAsync containing the path information or an error.
 */
export async function checkPathForCreate(rawPath: string | null): Promise<ResultAsync<CheckPathResult, CheckPathError>> {
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


/**
 * Check if all active or errored repositories are accessible and update their status accordingly.
 */
export async function checkAllActiveRepositories() {
    const storagesList = await db
        .select()
        .from(storages)
        .where(or(eq(storages.status, 'active'), eq(storages.status, 'error')))
        .execute();

    for (const storage of storagesList) {
        await checkRepository(storage);
    }
}


/**
 * Check if a repository is accessible and update the storage status accordingly.
 * @param storage The storage object to check.
 * @returns A promise that resolves to a boolean indicating if the repository is accessible.
 */
export async function checkRepository(storage: typeof storages.$inferSelect) {
    const checkResult = await getRepositoryStats(storage.url, storage.password!, storage.env);

    // If the repository is not accessible, update the storage status to error
    if (checkResult.isErr()) {
        await db
            .update(storages)
            .set({
                status: 'error',
                error: checkResult.error.message,
            })
            .where(eq(storages.id, storage.id))
            .execute();

        return false;
    }

    // If there was an error but now the repository is accessible, or if the size changed, update the storage status to ok
    const { total_size: diskSize } = checkResult.value[0];
    if (storage.status === 'error' || storage.diskSize !== diskSize) {
        await db
            .update(storages)
            .set({
                status: 'active',
                error: null,
                diskSize,
            })
            .where(eq(storages.id, storage.id))
            .execute();
    }

    return true;
}
