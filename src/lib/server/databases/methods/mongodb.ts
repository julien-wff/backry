import { buildDbUrlFromParams } from '$lib/server/databases/utils';
import { runCommandSync } from '$lib/server/services/cmd';
import type { ConnectionStringParams, EngineMethods } from '$lib/types/engine';
import { type ContainerInspectInfo } from 'dockerode';
import { MongoClient } from 'mongodb';
import { err, ok, Result, type ResultAsync } from 'neverthrow';


export const mongodbMethods = {
    dumpCommand: process.env.BACKRY_MONGODB_DUMP_CMD ?? 'mongodump',
    dumpFileExtension: 'archive',

    async getDumpCmdVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.dumpCommand, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    },

    getDumpCommand(connectionString, additionalArgs = []) {
        return [ this.dumpCommand, '--uri', connectionString, '--archive', '--quiet', ...additionalArgs ];
    },

    async checkConnection(connectionString): Promise<ResultAsync<string, string>> {
        try {
            const client = new MongoClient(connectionString, {
                connectTimeoutMS: 3000,
                timeoutMS: 3000,
                socketTimeoutMS: 3000,
                serverSelectionTimeoutMS: 3000,
            });
            await client.connect();
            await client.db().command({ ping: 1 });
            await client.close();
        } catch (e) {
            return err(e instanceof Error ? e.message : 'Unknown error');
        }
        return ok(connectionString);
    },

    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean {
        return container.Args[0] === 'mongod'
            || Object.keys(container.Config.ExposedPorts ?? {}).some(v => v.startsWith('27017/'));
    },

    buildConnectionString(params: ConnectionStringParams): Result<string, string> {
        if (!params.hostname) {
            return err('Hostname is required');
        }

        const url = buildDbUrlFromParams('mongodb', params);
        return ok(url.toString());
    },

    getCredentialsFromContainer(container: ContainerInspectInfo): ConnectionStringParams {
        const infos: ConnectionStringParams = {};

        const userKey = container.Config.Env.find(e => e.startsWith('MONGO_INITDB_ROOT_USERNAME='));
        if (userKey) {
            infos.username = userKey.split('=')[1];
        }

        const passwordKey = container.Config.Env.find(e => e.startsWith('MONGO_INITDB_ROOT_PASSWORD='));
        if (passwordKey) {
            infos.password = passwordKey.split('=')[1];
        }

        const dbKey = container.Config.Env.find(e => e.startsWith('MONGO_INITDB_DATABASE='));
        if (dbKey) {
            infos.database = dbKey.split('=')[1];
        }

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
