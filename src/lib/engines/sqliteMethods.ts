import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { runCommandSync } from '$lib/utils/cmd';
import { Database } from 'bun:sqlite';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export const sqliteMethods = {
    command: process.env.BACKRY_SQLITE3_CMD ?? 'sqlite3',
    dumpFileExtension: 'sql',

    async getVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.command, [ '--version' ]);
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
        return [ this.command, ...additionalArgs ?? [], '-readonly', connectionString, '.dump' ];
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
} satisfies EngineMethods;
