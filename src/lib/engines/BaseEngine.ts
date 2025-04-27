import type { ResultAsync } from 'neverthrow';

export abstract class BaseEngine {
    public abstract dumpFileExtension: string;
    public abstract displayName: string;
    public abstract icon: string;
    public abstract connectionStringPlaceholder: string;

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
     * @param connectionString Full connection string to the database.
     * @returns Empty ok or error message.
     */
    public abstract checkConnection(connectionString: string): Promise<ResultAsync<void, string>>;
}
