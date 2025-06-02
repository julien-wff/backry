/**
 * Create a random ID. If crypto.randomUUID is available, use it; otherwise, fall back to a random string using Math.random.
 * @returns A random ID string.
 */
export const randomId = () => typeof crypto === 'object' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
