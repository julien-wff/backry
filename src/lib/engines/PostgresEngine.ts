import type { BaseEngine } from '$lib/engines/BaseEngine';
import { runCommandSync } from '$lib/utils/cmd';
import { err, ok, type ResultAsync } from 'neverthrow';

export class PostgresEngine implements BaseEngine {
    public readonly dumpFileExtension = 'sql';

    private readonly pgDump = process.env.PG_DUMP_CMD ?? 'pg_dump';

    async getVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.pgDump, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    }

    getDumpCommand(connectionString: string, additionalArgs: string[] = []): string[] {
        return [ this.pgDump, ...additionalArgs, connectionString ];
    }
}
