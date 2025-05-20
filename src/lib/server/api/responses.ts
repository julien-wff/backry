import { json } from '@sveltejs/kit';

/**
 * API response type, with either error or data
 * @template T - Type of the data
 */
export type ApiResponse<T extends object> = {
    error: null;
    data: T;
} | {
    error: string;
    data: null;
}

/**
 * Create a JSON response for an error
 * @param error Error message
 * @param status HTTP status code, default is 400
 * @returns Response object
 */
export const apiError = (error: string, status = 400) => {
    return json(
        {
            error,
            data: null,
        } satisfies ApiResponse<object>,
        { status },
    );
};

/**
 * Create a JSON response for a successful API result
 * @param data Payload data
 * @param status HTTP status code, default is 200
 * @returns Response object
 */
export const apiSuccess = <T extends object>(data: T, status = 200) => {
    return json(
        {
            error: null,
            data,
        } satisfies ApiResponse<T>,
        { status },
    );
};
