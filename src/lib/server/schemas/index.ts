import { err, ok, type Result } from 'neverthrow';
import { prettifyError, type z, type ZodType } from 'zod';

/**
 * Parses the request body and validates it against the provided Zod schema.
 * @param request The request object to parse the body from.
 * @param schema The Zod schema to validate the request body against.
 * @returns A Result containing the parsed and validated data or an error message.
 */
export async function parseRequestBody<S extends ZodType>(request: Request, schema: S): Promise<Result<z.infer<S>, string>> {
    let body: unknown;
    try {
        body = await request.json();
    } catch (error) {
        return err(`Failed to parse request body: ${error}`);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return err(prettifyError(parsed.error));
    }

    return ok(parsed.data);
}
