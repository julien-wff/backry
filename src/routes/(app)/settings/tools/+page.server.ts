import type { DATABASE_ENGINES } from '$lib/db/schema';
import { checkAllEngines } from '$lib/engines';
import { getResticVersion } from '$lib/storages/restic';
import type { PageServerLoad } from './$types';
import { VERSION as svelteKitVersion } from '@sveltejs/kit';

export const load: PageServerLoad = async ({}) => {
    const [ resticVersion, enginesVersions ] = await Promise.all([
        getResticVersion(),
        checkAllEngines(),
    ]);

    return {
        bun: {
            version: Bun.version_with_sha,
            error: null,
        },
        svelteKit: {
            version: svelteKitVersion,
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
