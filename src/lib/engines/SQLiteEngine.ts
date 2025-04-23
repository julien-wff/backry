import type { databases } from '$lib/db/schema';
import { type BaseEngine } from '$lib/engines/BaseEngine';
import { runCommandSync } from '$lib/utils/cmd';
import { Database } from 'bun:sqlite';
import { err, ok, type ResultAsync } from 'neverthrow';

export class SQLiteEngine implements BaseEngine {
    readonly connectionStringPlaceholder = 'sqlite://path/to/database.db';
    readonly displayName = 'SQLite';
    readonly dumpFileExtension = 'sql';
    readonly icon = 'sqlite.svg';

    private readonly sqlite3 = process.env.SQLITE3_CMD ?? 'sqlite3';

    async getVersion(): Promise<ResultAsync<string, string>> {
        const res = await runCommandSync(this.sqlite3, [ '--version' ]);
        if (res.isErr()) {
            return err(res.error.stderr.toString().trim());
        }

        return ok(res.value.text().trim());
    }

    async checkConnection(db: typeof databases.$inferSelect): Promise<ResultAsync<void, string>> {
        try {
            const con = new Database(db.connectionString!, { readonly: true, create: false });
            con.close();
        } catch (e) {
            if (e instanceof Error) {
                return err(e.message);
            }
            return err(`Unknown error: ${JSON.stringify(e)}`);
        }

        return ok();
    }

    getDumpCommand(connectionString: string, additionalArgs?: string[]): string[] {
        return [ this.sqlite3, ...additionalArgs ?? [], '-readonly', connectionString, '.dump' ];
    }
}
