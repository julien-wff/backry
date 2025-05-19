import { getAllEnginesVersionsOrError } from '$lib/engines/checks';
import { getResticVersion, RESTIC_CMD } from '$lib/storages/restic';
import { VERSION as svelteKitVersion } from '@sveltejs/kit';
import path from 'path';
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
            cmd: Bun.argv[0].split(path.sep).at(-1) ?? null,
            cmdResolved: Bun.argv.join(' '),
        },
        svelteKit: {
            version: svelteKitVersion,
            error: null,
            cmd: null,
            cmdResolved: null,
        },
        restic: {
            version: resticVersion.isOk() ? resticVersion.value : null,
            error: resticVersion.isErr() ? resticVersion.error : null,
            cmd: RESTIC_CMD,
            cmdResolved: Bun.which(RESTIC_CMD),
        },
        ...enginesVersions,
    };
};
