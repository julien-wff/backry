import type { ContainerInspectInfo } from 'dockerode';
import type { ResultAsync } from 'neverthrow';

/**
 * Client-side metadata for the engine.
 */
export interface EngineMeta {
    displayName: string;
    icon: string;
    connectionStringPlaceholder: string;
}

/**
 * Server-side actions and information for the engine.
 */
export interface EngineMethods {
    /**
     * Engine dump command
     */
    command: string;

    /**
     * File extension for the dump file.
     */
    dumpFileExtension: string;

    /**
     * Get the version of the engine.
     * @returns Version of the engine, or error message.
     */
    getVersion(): Promise<ResultAsync<string, string>>;

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
     * @returns Empty ok or error message.
     */
    checkConnection(connectionString: string): Promise<ResultAsync<void, string>>;

    /**
     * Determine if the Docker container compatible with the engine.
     * @param container Docker container information.
     * @returns True if the container is compatible with the engine, false otherwise.
     */
    isDockerContainerFromEngine(container: ContainerInspectInfo): boolean;
}
