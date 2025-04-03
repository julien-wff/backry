import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is ('new') => {
    return param === 'new';
}) satisfies ParamMatcher;
