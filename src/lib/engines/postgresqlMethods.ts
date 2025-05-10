import type { EngineMethods } from '$lib/types/engine';
import { runCommandSync } from '$lib/utils/cmd';
import { SQL } from 'bun';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, type ResultAsync } from 'neverthrow';

export const postgresMethods = {
    command: process.env.BACKRY_PGDUMP_CMD ?? 'pg_dump',
    dumpFileExtension: 'sql',

    async getVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.command, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    getDumpCommand(connectionString, additionalArgs = []) {
        return [ this.command, ...additionalArgs, connectionString ];
    },

    async checkConnection(connectionString): Promise<ResultAsync<void, string>> {
        const con = new SQL({
            url: connectionString,
            connectionTimeout: 5,
        });

        try {
            await con.connect();
            await con.close();
            return ok();
        } catch (e) {
            return err(e instanceof Error ? e.message : 'Unknown error');
        }
    },

    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean {
        return container.Args[0] === 'postgres'
            || container.Mounts.some(m => m.Destination === '/var/lib/postgresql/data')
            || Object.keys(container.Config.Volumes ?? {}).some(v => v === '/var/lib/postgresql/data')
            || container.Config.Env.some(e => e.startsWith('PGDATA='))
            || container.Config.Env.some(e => e.startsWith('PG_VERSION='));
    },
} satisfies EngineMethods;
