import type { databases } from '$lib/db/schema';
import type { ResultAsync } from 'neverthrow';

export abstract class BaseEngine {
    public abstract dumpFileExtension: string;

    /**
     * Get the version of the engine.
     */
    public abstract getVersion(): Promise<ResultAsync<string, string>>;

    /**
     * Generate the dump command for the engine.
     * @param connectionString Full connection string to the database.
     * @param additionalArgs Additional arguments to pass to the dump command.
     * @returns Full command to run the dump.
     */
    public abstract getDumpCommand(connectionString: string, additionalArgs?: string[]): string[];

    /**
     * Check the connection to the database.
     * @param db The database object to check.
     * @returns Empty ok or error message.
     */
    public abstract checkConnection(db: typeof databases.$inferSelect): Promise<ResultAsync<void, string>>;
}
