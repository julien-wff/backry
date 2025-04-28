/**
 * Parses a string parameter from URL to determine if it is a valid numeric ID or a 'new' string.
 * @param param String parameter to parse, coming from the route params.
 * @returns An object containing the parsed ID (or null if invalid) and a boolean indicating if it's a 'new' parameter.
 */
export function parseIdOrNewParam(param: string): { id: number | null, isNew: boolean } {
    const parsedParam = parseInt(param);
    return {
        id: isNaN(parsedParam) || parsedParam < 0 ? null : parsedParam,
        isNew: param === 'new',
    };
}
