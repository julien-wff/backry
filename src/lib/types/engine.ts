import type { databases } from '$lib/server/db/schema';
import type { ContainerInspectInfo } from 'dockerode';
import { Result, type ResultAsync } from 'neverthrow';

/**
 * Object to represent the base elements of any database connection string.
 */
export interface ConnectionStringParams {
    username?: string;
    password?: string;
    hostname?: string;
    port?: number;
    /** Database name or file path */
    database?: string;
}

/**
 * Client-side metadata for the engine.
 */
export interface EngineMeta {
    displayName: string;
    icon: string;
    connectionStringPlaceholder: string;

    /**
     * For automatic detection of the engine from the connection string.
     * @param url Connection string or URL to check.
     * @return True if the URL is from the engine, false otherwise.
     */
    isUrlFromEngine?: (url: string) => boolean;
}

/**
 * Server-side actions and information for the engine.
 */
export interface EngineMethods {
    /**
     * Engine dump command.
     */
    dumpCommand: string;

    /**
     * Engine restore command.
     */
    restoreCommand: string;

    /**
     * Command to ping the database.
     * Can be optional in the case of internal checks, like with `bun:sqlite` or `Bun.SQL`.
     */
    checkCommand?: string;

    /**
     * File extension for the dump file.
     */
    dumpFileExtension: string;

    /**
     * Get the version of the dump command.
     * @returns CLI output, or error message.
     */
    getDumpCmdVersion(): Promise<ResultAsync<string, string>>;

    /**
     * Get the environment variables to use for the dump command, if any.
     * @returns Environment variables.
     */
    getDumpEnv?(database: typeof databases.$inferSelect): Record<string, string>;

    /**
     * Get the version of the check command.
     * If no check command is defined, this must not be defined.
     * @returns CLI output, or error message.
     */
    getCheckCmdVersion?(): Promise<ResultAsync<string, string>>;

    /**
     * Generate the dump command for the engine.
     * @param connectionString Full connection string to the database.
     * @param additionalArgs Additional arguments to pass to the dump command.
     * @returns Full command to run the dump.
     */
    getDumpCommand(connectionString: string, additionalArgs?: string[]): string[];

    /**
     * Check the connection to the database.
     * @param connectionString Full connection string to the database.
     * @returns On success, the connection string (potentially updated to apply fixes, like add the database name).
     *          On failure, the error message.
     */
    checkConnection(connectionString: string): Promise<ResultAsync<string, string>>;

    /**
     * Determine if the Docker container compatible with the engine.
     * @param container Docker container information.
     * @returns True if the container is compatible with the engine, false otherwise.
     */
    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean;

    /**
     * Create the connection string from the specified parameters.
     * @param params Individual parameters.
     * @return Connection string.
     */
    buildConnectionString(params: ConnectionStringParams): Result<string, string>;

    /**
     * Read some connection string parameters from the container information.
     * @param container Docker container inspect information.
     * @return Partially-filled connection string parameters.
     */
    getCredentialsFromContainer(container: ContainerInspectInfo): ConnectionStringParams;

    /**
     * Hide the password in the connection string.
     * @param connectionString Full connection string to the database.
     * @return Connection string with the password hidden.
     */
    hidePasswordInConnectionString(connectionString: string): string;

    /**
     * Recreate the database, by dropping it if it exists, and creating a new one.
     * If the engine does not support this operation, this method can be omitted.
     * @param connectionString Full connection string to the database.
     * @returns Nothing on success, error message on failure.
     */
    recreateDatabase?(connectionString: string): Promise<Result<void, string>>;

    /**
     * Get the command to restore a backup. The content of the backup will be piped to the command's stdin.
     * If the engine does not support this operation, this method can be omitted.
     * @param connectionString Full connection string to the database.
     * @param drop Some engines, like mongo, take the option to drop existing data before restoring directly in the
     *             restore command. Default is false.
     * @returns Full command to run the restore.
     */
    getRestoreBackupFromStdinCommand?(connectionString: string, drop?: boolean): string[];

    /**
     * Get the environment variables to use for the restore command, if any.
     * @param connectionString Full connection string to the database.
     * @returns Environment variables.
     */
    getRestoreEnv?(connectionString: string): Record<string, string>;
}
