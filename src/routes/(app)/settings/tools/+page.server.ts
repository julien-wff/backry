import type { DATABASE_ENGINES } from '$lib/db/schema';
import { checkAllEngines } from '$lib/engines';
import { getResticVersion } from '$lib/storages/restic';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
    const bunVersion = Bun.version_with_sha;
    const [ resticVersion, enginesVersions ] = await Promise.all([
        getResticVersion(),
        checkAllEngines(),
    ]);

    return {
        bun: {
            version: bunVersion,
            error: null,
        },
        restic: {
            version: resticVersion.isOk() ? resticVersion.value : null,
            error: resticVersion.isErr() ? resticVersion.error : null,
        },
        ...enginesVersions.reduce((obj, { id, version }) => ({
            ...obj,
            [id]: {
                version: version.isOk() ? version.value : null,
                error: version.isErr() ? version.error : null,
            },
        }), {} as Record<typeof DATABASE_ENGINES[number], { version: string | null; error: string | null }>),
    };
};
