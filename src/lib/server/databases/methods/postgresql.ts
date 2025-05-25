import { buildDbUrlFromParams } from '$lib/server/databases/utils';
import { runCommandSync } from '$lib/server/services/cmd';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { SQL } from 'bun';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

export const postgresqlMethods = {
    dumpCommand: process.env.BACKRY_POSTGRES_DUMP_CMD ?? 'pg_dump',
    dumpFileExtension: 'sql',

    async getDumpCmdVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.dumpCommand, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    getDumpCommand(connectionString, additionalArgs = []) {
        return [ this.dumpCommand, ...additionalArgs, connectionString ];
    },

    async checkConnection(connectionString): Promise<ResultAsync<void, string>> {
        let con: SQL;
        try {
            con = new SQL({
                url: connectionString,
                connectionTimeout: 3,
            });
        } catch (e) {
            return err(e instanceof Error ? e.message : 'Error creating instance');
        }

        try {
            await con.connect();
            await con.close();
            return ok();
        } catch (e) {
            return err(e instanceof Error ? e.message : 'Error connecting to database');
        }
    },

    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean {
        return container.Args[0] === 'postgres'
            || container.Mounts.some(m => m.Destination === '/var/lib/postgresql/data')
            || Object.keys(container.Config.Volumes ?? {}).some(v => v === '/var/lib/postgresql/data')
            || container.Config.Env.some(e => e.startsWith('PGDATA='))
            || container.Config.Env.some(e => e.startsWith('PG_VERSION='));
    },

    buildConnectionString(params: ConnectionStringParams): Result<string, string> {
        if (!params.hostname) {
            return err('Hostname is required');
        }

        const url = buildDbUrlFromParams('postgres', params);
        return ok(url.toString());
    },

    getCredentialsFromContainer(container: ContainerInspectInfo): ConnectionStringParams {
        const infos: ConnectionStringParams = {};

        const userKey = container.Config.Env.find(e => e.startsWith('POSTGRES_USER='));
        infos.username = userKey?.split('=')?.[1] ?? 'postgres';

        const passwordKey = container.Config.Env.find(e => e.startsWith('POSTGRES_PASSWORD='));
        if (passwordKey) {
            infos.password = passwordKey.split('=')[1];
        }

        const dbKey = container.Config.Env.find(e => e.startsWith('POSTGRES_DB='));
        infos.database = dbKey?.split('=')?.[1] ?? infos.username;

        return infos;
    },

    hidePasswordInConnectionString(connectionString: string): string {
        const url = new URL(connectionString);
        if (url.password) {
            url.password = '***';
        }
        return url.toString();
    },
} satisfies EngineMethods;
