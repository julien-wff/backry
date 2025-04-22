import { engines } from '$lib/engines';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({}) => {
    const engineList = Object.entries(engines).map(([ key, value ]) => {
        const engine = new value();
        return {
            id: key,
            displayName: engine.displayName,
            icon: engine.icon,
        };
    });

    return {
        engines: engineList,
    };
};
