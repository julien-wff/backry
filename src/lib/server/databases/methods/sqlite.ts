import { runCommandSync } from '$lib/server/services/cmd';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { Database } from 'bun:sqlite';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, type Result } from 'neverthrow';
import path from 'node:path';
import fs from 'node:fs/promises';

export const sqliteMethods = {
    dumpCommand: process.env.BACKRY_SQLITE_DUMP_CMD ?? 'sqlite3',
    restoreCommand: process.env.BACKRY_SQLITE_RESTORE_CMD ?? process.env.BACKRY_SQLITE_DUMP_CMD ?? 'sqlite3',
    dumpFileExtension: 'sql',

    async getDumpCmdVersion(): Promise<Result<string, string>> {
        const res = await runCommandSync(this.dumpCommand, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    async checkConnection(connectionString: string): Promise<Result<string, string>> {
        // No need to specify the database
        try {
            const con = new Database(connectionString, { readonly: true, create: false });
            con.close();
        } catch (e) {
            if (e instanceof Error) {
                return err(e.message);
            }
            return err(`Unknown error: ${JSON.stringify(e)}`);
        }

        return ok(connectionString);
    },

    getDumpCommand(connectionString: string, additionalArgs?: string[]): string[] {
        return [ this.dumpCommand, ...additionalArgs ?? [], '-readonly', connectionString, '.dump' ];
    },

    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean {
        return false;
    },

    buildConnectionString(params: ConnectionStringParams): Result<string, string> {
        if (!params.database) {
            return err('Missing "database" parameter');
        }

        return ok(`sqlite://${params.database}`);
    },

    getCredentialsFromContainer(container: ContainerInspectInfo): ConnectionStringParams {
        return {};
    },

    hidePasswordInConnectionString(connectionString: string): string {
        // SQLite does not use credentials in the connection string
        return connectionString;
    },

    async recreateDatabase(connectionString: string): Promise<Result<void, string>> {
        // Extract the file path from the connection string
        let dbPath: string;
        try {
            dbPath = connectionString.startsWith('sqlite://')
                ? new URL(connectionString).pathname
                : connectionString;
        } catch (e) {
            return err(`Invalid connection string: ${(e as Error).message}`);
        }

        // Ensure the directory exists
        const dir = path.dirname(path.resolve(dbPath));
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (e) {
            return err(`Failed to create directory ${dir}: ${(e as Error).message}`);
        }

        // Delete the db file if it exists
        try {
            await Bun.file(dbPath).delete();
        } catch (e) {
            const deleteError = e as NodeJS.ErrnoException;
            if (deleteError.code !== 'ENOENT') {
                return err(`Failed to delete existing database file ${dbPath}: ${deleteError.message}`);
            }
        }

        // Also delete -wal and -shm files if they exist
        try {
            await Promise.all([
                Bun.file(`${dbPath}-wal`).delete(),
                Bun.file(`${dbPath}-shm`).delete(),
            ]);
        } catch {
            // Ignore errors for -wal and -shm files
        }

        // No need to recreate the file, it will be created on restore

        return ok(undefined);
    },

    getRestoreBackupFromStdinCommand(connectionString: string): string[] {
        return [ this.restoreCommand, connectionString ];
    },

    async getRestoreCmdVersion(): Promise<Result<string, string>> {
        const res = await runCommandSync(this.restoreCommand, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },
} satisfies EngineMethods;
