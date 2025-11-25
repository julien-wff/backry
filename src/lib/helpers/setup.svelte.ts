import { goto } from '$app/navigation';
import type { SETUP_STEPS } from '$lib/common/constants';
import { fetchApi } from '$lib/helpers/fetch';
import type { settingsChangeRequest } from '$lib/server/schemas/api';
import { type z } from 'zod';

/**
 * Manage loading status and error while updating setup settings.
 */
export class SetupApiStore {
    loading = $state(false);
    error = $state<string | null>(null);

    constructor(readonly nextAction: typeof SETUP_STEPS[number] | CallableFunction) {
    }

    async updateSettingsAndGoToNextStep(settings: z.infer<typeof settingsChangeRequest> = {}) {
        if (this.loading) {
            return;
        }

        this.loading = true;
        this.error = null;

        const res = await fetchApi<object, typeof settingsChangeRequest>(
            'POST',
            '/api/setup/settings',
            {
                ...settings,
                setupCurrentStep: typeof this.nextAction === 'string' ? this.nextAction : undefined,
            },
        );
        this.loading = false;

        if (res.isErr()) {
            this.error = res.error;
            return;
        }

        if (typeof this.nextAction === 'function') {
            this.nextAction();
        } else {
            await goto(`/setup/${this.nextAction}`);
        }
    }
}
