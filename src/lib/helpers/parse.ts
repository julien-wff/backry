/**
 * Parses a string to a positive integer.
 * If the input is invalid or negative, the default value is returned (null if not specified).
 * @param value String to parse as a positive integer
 * @param defaultValue Default value to return if the input is invalid or negative
 * @returns Parsed positive integer or the default value
 * @template D Type of the default value, defaults to null
 */
export function positiveInt<D = null>(value: string | null | undefined, defaultValue: D = null as D): number | D {
    if (!value?.trim()) {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    return (isNaN(parsed) || parsed < 0) ? defaultValue : parsed;
}

/**
 * Parses a string to be one of the items in a predefined list.
 * If the input is invalid or not in the list,the default value is returned (null if not specified).
 * @param value String to parse as an item from the list
 * @param list List of valid items to check against
 * @param defaultValue Default value to return if the input is invalid or not in the list
 * @returns Item from the list or the default value
 * @template T List of valid items, must be a non-empty tuple
 * @template D Type of the default value, defaults to null
 */
export function itemFromList<const T extends readonly [ string, ...string[] ], D = null>(
    value: string | null | undefined,
    list: T,
    defaultValue: D = null as D,
): T[number] | D {
    if (!value?.trim()) {
        return defaultValue;
    }

    const item = value.trim();
    return list.includes(item) ? item : defaultValue;
}
