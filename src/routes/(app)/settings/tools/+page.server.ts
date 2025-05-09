import { getAllEnginesVersionsOrError } from '$lib/engines/checks';
import { getResticVersion } from '$lib/storages/restic';
import { VERSION as svelteKitVersion } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
    const [ resticVersion, enginesVersions ] = await Promise.all([
        getResticVersion(),
        getAllEnginesVersionsOrError(),
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
        ...enginesVersions,
    };
};
