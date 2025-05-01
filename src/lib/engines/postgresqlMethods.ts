import type { EngineMethods } from '$lib/types/engine';
import { runCommandSync } from '$lib/utils/cmd';
import { SQL } from 'bun';
import { err, ok, type ResultAsync } from 'neverthrow';

export const postgresMethods = {
    command: process.env.PG_DUMP_CMD ?? 'pg_dump',
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
} satisfies EngineMethods;
