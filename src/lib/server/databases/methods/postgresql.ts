import { buildDbUrlFromParams } from '$lib/server/databases/utils';
import { runCommandSync } from '$lib/server/services/cmd';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { SQL } from 'bun';
import { type ContainerInspectInfo } from 'dockerode';
import { err, ok, Result, type ResultAsync } from 'neverthrow';
import dayjs from 'dayjs';

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

    async checkConnection(connectionString): Promise<ResultAsync<string, string>> {
        // If no database is specified, update the connection string to use the current one.
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
            const url = new URL(connectionString);

            if (!url.pathname || url.pathname === '/') {
                const dbName = await con`SELECT current_database()`.then(res => res[0]?.current_database);
                if (!dbName) {
                    throw new Error('Could not retrieve database name');
                }

                url.pathname = `/${dbName}`;
            }

            return ok(url.toString());
        } catch (e) {
            return err(e instanceof Error ? e.message : 'Error connecting to database');
        } finally {
            await con.close();
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

    async recreateDatabase(connectionString: string): Promise<Result<void, string>> {
        // We cannot be connected to the database we are recreating. If the db in question is not 'postgres', we connect to it.
        // If we are restoring the 'postgres' db, we need to connect to a temporary database 'backry-restore-tmp-[date]',
        // That we create for this purpose, and then drop after the operation.
        const url = new URL(connectionString);
        if (!url.pathname || url.pathname === '/') {
            return err('Database name is required in the connection string to recreate it');
        }

        const dbToRecreate = url.pathname.slice(1);

        let tempAdminDb: string | null = null;
        if (dbToRecreate === 'postgres') {
            tempAdminDb = `backry-restore-tmp-${dayjs().format('YYYYMMDD-HHmmss')}`;
        }
        url.pathname = `/postgres`; // If temp DB: first connect to 'postgres' to create the temp db.

        let con: SQL | null = null;
        try {
            con = new SQL({
                url,
                connectionTimeout: 3,
            });
            await con.connect();

            if (tempAdminDb) {
                // Create temp DB and switch to it
                await con`CREATE DATABASE ${con(tempAdminDb)}`;
                await con.close();
                url.pathname = `/${tempAdminDb}`;
                con = new SQL({
                    url,
                    connectionTimeout: 3,
                });
                await con.connect();
            }

            // Terminate all connections to the database.
            await con`SELECT pg_terminate_backend(pg_stat_activity.pid)
                      FROM pg_stat_activity
                      WHERE pg_stat_activity.datname = ${dbToRecreate}
                        AND pid <> pg_backend_pid()`;

            // Drop the database.
            await con`DROP DATABASE IF EXISTS ${con(dbToRecreate)}`;

            // Recreate the database.
            await con`CREATE DATABASE ${con(dbToRecreate)}`;

            // Delete temp admin DB if needed.
            if (tempAdminDb) {
                // Close connection to temp DB and drop it.
                await con.close();
                con = new SQL({
                    url: url, // Still connected to temp db
                    connectionTimeout: 3,
                });
                await con.connect();
                await con`DROP DATABASE IF EXISTS ${con(tempAdminDb)}`;
            }
        } catch (e) {
            return err(e instanceof Error ? e.message : 'Error recreating database');
        } finally {
            await con?.close();
        }

        return ok(undefined);
    },

    getRestoreBackupFromStdinCommand(connectionString: string): string[] {
        return [ 'psql', connectionString ];
    },
} satisfies EngineMethods;
