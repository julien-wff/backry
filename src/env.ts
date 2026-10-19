import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
    PUBLIC_BUILD_DATE: { public: true, static: true },
    PUBLIC_VCS_REF: { public: true, static: true },
    PUBLIC_VERSION: { public: true, static: true },
    DATABASE_URL: { schema: (input) => input ?? '' },
});
