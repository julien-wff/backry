import { buildDbUrlFromParams } from '$lib/server/databases/utils';
import { databases } from '$lib/server/db/schema';
import { runCommandSync } from '$lib/server/services/cmd';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
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
    checkCommand: process.env.BACKRY_MYSQL_CHECK_CMD ?? process.env.BACKRY_MYSQL_RESTORE_CMD ?? 'mysql',
    dumpCommand: process.env.BACKRY_MYSQL_DUMP_CMD ?? 'mysqldump',
    restoreCommand: process.env.BACKRY_MYSQL_RESTORE_CMD ?? process.env.BACKRY_MYSQL_CHECK_CMD ?? 'mysql',
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

    async checkConnection(connectionString): Promise<ResultAsync<string, string>> {
        // A database name is required for MySQL connections. However, there is no "default database" like with PostgreSQL.
        const url = URL.parse(connectionString);
        if (!url) {
            return err('Invalid connection string');
        }

        if (!url.pathname || url.pathname === '/') {
            return err('Database name is required in the connection string');
        }

        const res = await runCommandSync(
            this.checkCommand!,
            [
                '--connect-timeout=3',
                ...connectionStringToOptions(connectionString),
                '--execute=SELECT 1',
            ],
            {
                env: {
                    MYSQL_PWD: url.password ?? '',
                },
            },
        );
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(connectionString);
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

    hidePasswordInConnectionString(connectionString: string): string {
        const url = new URL(connectionString);
        if (url.password) {
            url.password = '***';
        }
        return url.toString();
    },

    async recreateDatabase(connectionString: string): Promise<Result<void, string>> {
        const url = URL.parse(connectionString);
        if (!url) {
            return err('Invalid connection string');
        }

        if (!url.pathname || url.pathname === '/') {
            return err('Database name is required in the connection string');
        }
        // Remove leading slash and escape backticks
        const dbName = url.pathname.slice(1).replace(/`/g, '``');

        if ([ 'mysql', 'information_schema', 'performance_schema', 'sys' ].includes(dbName)) {
            return err(`Refusing to drop and recreate system database "${dbName}"`);
        }

        // Connect to the default database so we can drop and recreate the target database.
        url.pathname = '/mysql';

        const res = await runCommandSync(
            this.restoreCommand,
            [
                '--connect-timeout=3',
                ...connectionStringToOptions(url.toString()),
                `--execute=DROP DATABASE IF EXISTS \`${dbName}\`; CREATE DATABASE \`${dbName}\`;`,
            ],
            {
                env: {
                    MYSQL_PWD: url.password ?? '',
                },
            },
        );
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok();
    },

    getRestoreBackupFromStdinCommand(connectionString: string): string[] {
        return [ this.restoreCommand, ...connectionStringToOptions(connectionString) ];
    },

    getRestoreEnv(connectionString: string): Record<string, string> {
        const url = URL.parse(connectionString);
        return {
            MYSQL_PWD: url?.password ?? '',
        };
    },
} satisfies EngineMethods;
