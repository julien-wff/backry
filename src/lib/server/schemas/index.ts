import { err, ok, type ResultAsync } from 'neverthrow';
import { z, ZodSchema } from 'zod';
import { fromError } from 'zod-validation-error';

/**
 * Parses the request body and validates it against the provided Zod schema.
 * @param request The request object to parse the body from.
 * @param schema The Zod schema to validate the request body against.
 * @returns A ResultAsync containing the parsed and validated data or an error message.
 */
export async function parseRequestBody<S extends ZodSchema>(request: Request, schema: S): Promise<ResultAsync<z.infer<S>, string>> {
    let body: unknown;
    try {
        body = await request.json();
    } catch (error) {
        return err(`Failed to parse request body: ${error}`);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return err(fromError(parsed.error).toString());
    }

    return ok(parsed.data);
}
