import type { ConnectionStringParams } from '$lib/types/engine';

/**
 * Apply the basic params to the URL
 * @param scheme Base URL scheme, without the ://
 * @param params Params to apply
 */
export function buildDbUrlFromParams(scheme: string, params: ConnectionStringParams): URL {
    const url = new URL(`${scheme}://`);

    const paramsMapping = {
        'hostname': 'hostname',
        'port': 'port',
        'username': 'username',
        'password': 'password',
        'database': 'pathname',
    } as Record<keyof ConnectionStringParams, Exclude<keyof URL, 'origin' | 'searchParams' | 'toString' | 'toJSON'>>;

    for (const [ param, urlKey ] of Object.entries(paramsMapping)) {
        const value = params[param as keyof ConnectionStringParams];
        if (value) {
            url[urlKey] = value.toString();
        }
    }

    return url;
}
