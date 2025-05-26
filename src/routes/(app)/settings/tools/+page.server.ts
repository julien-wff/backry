import { getAllEnginesVersionsOrError } from '$lib/server/databases/checks';
import { getResticVersion, RESTIC_CMD } from '$lib/server/services/restic';
import { getShoutrrrVersion, SHOUTRRR_CMD } from '$lib/server/services/shoutrrr';
import { setToolChecksSuccess } from '$lib/server/shared/tool-checks';
import { VERSION as svelteKitVersion } from '@sveltejs/kit';
import path from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
    const [ resticVersion, enginesVersions, shoutrrrVersion ] = await Promise.all([
        getResticVersion(),
        getAllEnginesVersionsOrError(),
        getShoutrrrVersion(),
    ]);

    // Warning: this will not update errors.tools in +layout.server.ts right away, data needs to be invalidated client-side
    setToolChecksSuccess(resticVersion.isOk()
        && shoutrrrVersion.isOk()
        && Object.values(enginesVersions).every(engine => !engine.error),
    );

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
        shoutrrr: {
            version: shoutrrrVersion.isOk() ? shoutrrrVersion.value : null,
            error: shoutrrrVersion.isErr() ? shoutrrrVersion.error : null,
            cmd: SHOUTRRR_CMD,
            cmdResolved: Bun.which(SHOUTRRR_CMD),
        },
        ...enginesVersions,
    };
};
