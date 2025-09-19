import { $ } from 'bun';
import { err, ok, type Result } from 'neverthrow';

interface CommandOptions {
    cwd?: string;
    env?: Record<string, string>;
}

export async function runCommandSync(command: string, args: string[] = [], options?: CommandOptions): Promise<Result<$.ShellOutput, $.ShellOutput>> {
    const cmd = $`${command} ${{ raw: args.map($.escape).join(' ') }}`
        .env(options?.env)
        .nothrow()
        .quiet();

    if (options?.cwd) {
        cmd.cwd(options.cwd);
    }

    const res = await cmd;

    if (res.exitCode !== 0) {
        return err(res);
    }

    return ok(res);
}


/**
 * Pipe the output of command1 to command2. Waits for both commands to finish to return the result.
 * @param command1 First command
 * @param args1 Arguments for the first command, escaped via Bun's `$.escape`
 * @param command2 Second command
 * @param args2 Arguments for the second command, escaped via Bun's `$.escape`
 * @param options Options for the command
 * @returns Result with ShellOutput on success, or ShellOutput on error
 */
export async function pipeCommandSync(command1: string, args1: string[] = [], command2: string, args2: string[] = [], options?: CommandOptions): Promise<Result<$.ShellOutput, $.ShellOutput>> {
    const cmd = $`${command1} ${{ raw: args1.map($.escape).join(' ') }} | ${command2} ${{ raw: args2.map($.escape).join(' ') }}`
        .env(options?.env)
        .nothrow()
        .quiet();

    if (options?.cwd) {
        cmd.cwd(options.cwd);
    }

    const res = await cmd;

    if (res.exitCode !== 0) {
        return err(res);
    }

    return ok(res);
}


export interface StreamCommandOptions<O, E> extends CommandOptions {
    json?: boolean;
    onStdout?: (data: O) => any;
    onStderr?: (data: E) => any;
}


async function readAndDecodeStream<T>(
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>,
    json: boolean,
    onChunk?: (chunk: T) => void,
): Promise<Result<T[], Error>> {
    const textDecoder = new TextDecoder();
    const result: T[] = [];

    try {
        await reader.read().then(async function readChunk({ done, value }): Promise<void> {
            if (done) {
                return;
            }

            const text = textDecoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                let parsedLine: T;
                if (json) {
                    try {
                        parsedLine = JSON.parse(line) as T;
                    } catch {
                        throw new Error(`Failed to parse JSON: ${line}`);
                    }
                } else {
                    parsedLine = line as T;
                }

                result.push(parsedLine);
                onChunk?.(parsedLine);
            }

            return reader.read().then(readChunk);
        });
    } catch (e) {
        return err(e as Error);
    }

    return ok(result);
}


export async function runCommandStream<O, E>(command: string, args: string[] = [], options?: StreamCommandOptions<O, E>): Promise<Result<O[], (E | Error)[]>> {
    const subprocess = Bun.spawn([ command, ...args ], {
        cwd: options?.cwd,
        env: options?.env,
        stdout: 'pipe',
        stderr: 'pipe',
    });

    const stdoutStream = subprocess.stdout.getReader();
    const stderrStream = subprocess.stderr.getReader();
    const [ stdoutResult, stderrResult ] = await Promise.all([
        readAndDecodeStream<O>(stdoutStream, options?.json ?? false, options?.onStdout),
        readAndDecodeStream<E>(stderrStream, options?.json ?? false, options?.onStderr),
    ]);

    if (stdoutResult.isErr()) {
        return err([ stdoutResult.error ]);
    }

    if (stderrResult.isErr()) {
        return err([ stderrResult.error ]);
    }

    if (stderrResult.value.length > 0) {
        return err(stderrResult.value);
    }

    return ok(stdoutResult.value);
}
