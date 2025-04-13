import { $, type ShellOutput } from 'bun';
import { err, ok, type ResultAsync } from 'neverthrow';

interface CommandOptions {
    cwd?: string;
    env?: Record<string, string>;
}

export async function runCommandSync(command: string, args: string[] = [], options?: CommandOptions): Promise<ResultAsync<ShellOutput, ShellOutput>> {
    const cmd = $`${command} ${{ raw: args.map($.escape).join(' ') }}"`
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
