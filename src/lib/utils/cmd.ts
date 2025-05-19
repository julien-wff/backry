import { $ } from 'bun';
import { err, ok, type ResultAsync } from 'neverthrow';

interface CommandOptions {
    cwd?: string;
    env?: Record<string, string>;
}

export async function runCommandSync(command: string, args: string[] = [], options?: CommandOptions): Promise<ResultAsync<$.ShellOutput, $.ShellOutput>> {
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


export interface StreamCommandOptions<O, E> extends CommandOptions {
    json?: boolean;
    onStdout?: (data: O) => any;
    onStderr?: (data: E) => any;
}


async function readAndDecodeStream<T>(
    reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>,
    json: boolean,
    onChunk?: (chunk: T) => void,
): Promise<ResultAsync<T[], Error>> {
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


export async function runCommandStream<O, E>(command: string, args: string[] = [], options?: StreamCommandOptions<O, E>): Promise<ResultAsync<O[], (E | Error)[]>> {
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
