import { runCommandSync } from '$lib/server/services/cmd';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { Database } from 'bun:sqlite';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export const sqliteMethods = {
    dumpCommand: process.env.BACKRY_SQLITE_DUMP_CMD ?? 'sqlite3',
    dumpFileExtension: 'sql',

    async getDumpCmdVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.dumpCommand, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    async checkConnection(connectionString: string): Promise<ResultAsync<void, string>> {
        try {
            const con = new Database(connectionString, { readonly: true, create: false });
            con.close();
        } catch (e) {
            if (e instanceof Error) {
                return err(e.message);
            }
            return err(`Unknown error: ${JSON.stringify(e)}`);
        }

        return ok();
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
} satisfies EngineMethods;
