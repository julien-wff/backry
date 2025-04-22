import type { SubmitFunction } from '@sveltejs/kit';

type Result = Record<string, unknown> | undefined;
type BaseEnhance<Success extends Result, Failure extends Result> =
    (form_element: HTMLFormElement, submit?: SubmitFunction<Success, Failure>) => void;

interface CustomEnhanceArgs<Success extends Result, Failure extends Result> {
    enhance: BaseEnhance<Success, Failure>;
    error?: { current: string | null };
}

/**
 * Custom enhance function that doesn't clear the form and disables the submit button
 * @param form Form element
 * @param enhance Enhance function from `$app/forms`
 * @param error Optional error object to set the error message
 * @returns Improved enhance function ready to use as `use:customEnhance={{enhance, error}}`
 */
export function customEnhance<Success extends Result, Failure extends Result>(
    form: HTMLFormElement,
    { enhance, error }: CustomEnhanceArgs<Success, Failure>,
) {
    return enhance(form, async ({ submitter }) => {
        (submitter as HTMLButtonElement).disabled = true;
        if (error) {
            error.current = null;
        }

        return ({ update, result }) => {
            if (result.type !== 'redirect') {
                (submitter as HTMLButtonElement).disabled = false;
            }
            update({ reset: false });

            if (error && result.type === 'failure') {
                // string error
                if (typeof result.data?.['error'] === 'string') {
                    error.current = result.data['error'];
                }

                // zod-validation-error errors
                if (Array.isArray(result.data?.['error']) && 'message' in result.data['error'][0]) {
                    error.current = result.data['error'].map((e) => e.message).join('\n');
                }
            }
        };
    });
}
