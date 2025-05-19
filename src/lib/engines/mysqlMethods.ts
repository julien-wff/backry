import { databases } from '$lib/db/schema';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { runCommandSync } from '$lib/utils/cmd';
import { buildDbUrlFromParams } from '$lib/utils/url';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, Result, type ResultAsync } from 'neverthrow';

/**
 * Convert a connection string to an array of options for the mysql command line client.
 * @param str The connection string to convert.
 * @param databaseWithFlag Whether to include the database under the --database flag (mysql)
 *                         or as a positional argument (mysqldump).
 */
function connectionStringToOptions(str: string, databaseWithFlag = true): string[] {
    const url = URL.parse(str);
    if (!url) {
        return [];
    }

    const options: string[] = [];
    if (url.username) {
        options.push(`--user=${url.username}`);
    }
    if (url.hostname) {
        options.push(`--host=${url.hostname}`);
    }
    if (url.port) {
        options.push(`--port=${url.port}`);
    }
    if (url.search) {
        const params = new URLSearchParams(url.search);
        for (const [ key, value ] of params.entries()) {
            options.push(`--${key}=${value}`);
        }
    }
    if (url.pathname) {
        const database = url.pathname.slice(1); // Remove leading slash
        if (databaseWithFlag) {
            options.push(`--database=${database}`);
        } else {
            options.push(database);
        }
    }

    return options;
}

export const mysqlMethods = {
    checkCommand: process.env.BACKRY_MYSQL_CHECK_CMD ?? 'mysql',
    dumpCommand: process.env.BACKRY_MYSQL_DUMP_CMD ?? 'mysqldump',
    dumpFileExtension: 'sql',

    async getDumpCmdVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.dumpCommand, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    async getCheckCmdVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.checkCommand!, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    getDumpCommand(connectionString, additionalArgs = []) {
        return [ this.dumpCommand, ...additionalArgs, ...connectionStringToOptions(connectionString, false) ];
    },

    getDumpEnv(database: typeof databases.$inferSelect): Record<string, string> {
        return {
            MYSQL_PWD: URL.parse(database.connectionString)?.password ?? '',
        };
    },

    async checkConnection(connectionString): Promise<ResultAsync<void, string>> {
        const res = await runCommandSync(
            this.checkCommand!,
            [
                ...connectionStringToOptions(connectionString),
                '--execute=SELECT 1',
            ],
            {
                env: {
                    MYSQL_PWD: URL.parse(connectionString)?.password ?? '',
                },
            },
        );
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(undefined);
    },

    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean {
        return container.Args[0] === 'mysqld'
            || container.Mounts.some(m => m.Destination === '/var/lib/mysql')
            || Object.keys(container.Config.Volumes ?? {}).some(v => v === '/var/lib/mysql')
            || container.Config.Env.some(e => e.startsWith('MYSQL_VERSION='));
    },

    buildConnectionString(params: ConnectionStringParams): Result<string, string> {
        if (!params.hostname) {
            return err('Hostname is required');
        }

        const url = buildDbUrlFromParams('mysql', params);
        url.searchParams.set('protocol', 'TCP');
        return ok(url.toString());
    },

    getCredentialsFromContainer(container: ContainerInspectInfo): ConnectionStringParams {
        const infos: ConnectionStringParams = {};

        const userKey = container.Config.Env.find(e => e.startsWith('MYSQL_USER='));
        infos.username = userKey?.split('=')?.[1] ?? 'root';

        const passwordKey = container.Config.Env.find(e => e.startsWith('MYSQL_PASSWORD='))
            || container.Config.Env.find(e => e.startsWith('MYSQL_ROOT_PASSWORD='));
        if (passwordKey) {
            infos.password = passwordKey.split('=')[1];
        }

        const dbKey = container.Config.Env.find(e => e.startsWith('MYSQL_DATABASE='));
        infos.database = dbKey?.split('=')?.[1] ?? 'database';

        return infos;
    },
} satisfies EngineMethods;
