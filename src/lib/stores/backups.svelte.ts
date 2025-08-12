import type { RunsQueryResult as ApiRunsQueryResult } from '$lib/server/schemas/api';
import { fetchApi, subscribeApi } from '$lib/helpers/fetch';
import type { BackupUpdateEventPayload } from '$lib/server/shared/events';
import { invalidateAll } from '$app/navigation';
import type { getRunsWithBackupFilter } from '$lib/server/queries/runs';

type PageRunsQueryResult = Awaited<ReturnType<typeof getRunsWithBackupFilter>>;
type Run = PageRunsQueryResult['runs'][number];

export class BackupsStore {
    // Page runs (coming from +page.server.ts)
    private _pageRuns: Map<number, Run>;
    private readonly _knownPageBackupIds: Set<number>;
    private readonly _pageJobs: PageRunsQueryResult['jobs'];
    private readonly _pageDatabases: PageRunsQueryResult['databases'];

    // API runs (coming from page scroll)
    private _apiRuns = $state<Map<number, Run>>(new Map());
    private _knownApiBackupIds = new Set();
    private _apiJobs = $state<Map<number, ApiRunsQueryResult['jobs'][number]>>(new Map());
    private _apiDatabases = $state<Map<number, ApiRunsQueryResult['databases'][number]>>(new Map());
    private _lastFetchedCount = $state(0);

    // Shared data
    private readonly _jobs: PageRunsQueryResult['jobs'];
    private readonly _databases: PageRunsQueryResult['databases'];
    private readonly _fetchLimit: number;

    // Derived values
    readonly backupCount;

    // Getters
    get runs() {
        return [ ...BackupsStore._mergeRuns(this._pageRuns, this._apiRuns).values() ];
    }

    get databases() {
        return this._databases;
    }

    /**
     * Checks if there are more backups available to fetch.
     * @return True if there are more backups, false otherwise
     */
    get isMoreAvailable() {
        // If we fetched less than the limit, there are no more backups to fetch
        return this._lastFetchedCount === this._fetchLimit;
    }

    /**
     * Get the job associated with a run.
     * @param run Run to get the job for
     * @return Job associated with the run, or undefined if not found
     */
    getRunJob(run: Run) {
        return this._jobs.get(run.jobId);
    }

    // Methods
    constructor(data: () => PageRunsQueryResult) {
        // Page data
        this._pageRuns = $derived(BackupsStore._arrayToMap(data().runs));
        this._knownPageBackupIds = $derived(BackupsStore._runsMapToBackupIds(this._pageRuns));
        this._pageJobs = $derived(data().jobs);
        this._pageDatabases = $derived(data().databases);

        // API data
        this._lastFetchedCount = data().runs.reduce((count, run) => count + run.backups.length, 0);

        // Shared data
        this._fetchLimit = data().limit;
        this.backupCount = $derived(
            this._pageRuns.values().reduce((count, run) => count + run.backups.length, 0)
            + this._apiRuns.values().reduce((count, run) => count + run.backups.length, 0),
        );
        this._jobs = $derived(BackupsStore._arrayToMap([ ...this._pageJobs.values(), ...this._apiJobs.values() ]));
        this._databases = $derived(BackupsStore._arrayToMap([ ...this._pageDatabases.values(), ...this._apiDatabases.values() ]));
    }

    /**
     * Subscribe to individual backup updates from the server.
     * @returns Function to unsubscribe from the updates.
     */
    subscribe() {
        return subscribeApi('/api/backups/subscribe', this._handleSubscriptionUpdate.bind(this));
    }

    /**
     * Handles updates from the backup subscription, by updating the runs
     * @param chunk Update chunk from the server
     * @private
     */
    private _handleSubscriptionUpdate(chunk: BackupUpdateEventPayload) {
        // TODO: An update on an API backup would call invalidateAll() indefinitely
        if (!this._knownPageBackupIds.has(chunk.id) && !this._knownApiBackupIds.has(chunk.id)) {
            // If the backup is not known, it means it's a new one, so get it via page load function
            void invalidateAll();
            // Add it to the known page backups to avoid re-triggering invalidation
            this._knownPageBackupIds.add(chunk.id);
        } else if (this._knownPageBackupIds.has(chunk.id)) {
            // If the backup is known in the page runs, update it
            this._pageRuns = BackupsStore._updateRunBackup(this._pageRuns, chunk);
        } else if (this._knownApiBackupIds.has(chunk.id)) {
            // If the backup is known in the API runs, update it
            this._apiRuns = BackupsStore._updateRunBackup(this._apiRuns, chunk);
        }
    }

    /**
     * Updates a run in the given runs map with the provided backup update chunk.
     * @param runs Map of runs to update
     * @param chunk Backup update chunk containing the run ID and backup details
     * @private
     */
    private static _updateRunBackup(runs: Map<number, Run>, chunk: BackupUpdateEventPayload) {
        const run = runs.values().find(run => run.backups.some(backup => backup.id === chunk.id));
        if (!run) {
            return runs;
        }

        runs.set(run.id, {
            ...run,
            backups: run.backups.map(backup => (backup.id === chunk.id ? { ...backup, ...chunk } : backup)),
        });
        return new Map(runs);
    }

    /**
     * Merges two runs maps, combining backups of runs with the same ID.
     * @param base Base runs map to merge into
     * @param updates Backups to append if the run already exists, otherwise add the run
     * @return Merged runs map
     * @private
     */
    private static _mergeRuns(base: Map<number, Run>, updates: Map<number, Run>): Map<number, Run> {
        const merged = new Map(base);
        for (const [ id, update ] of updates) {
            if (merged.has(id)) {
                const existing = merged.get(id)!;
                merged.set(id, {
                    ...existing,
                    backups: [ ...existing.backups, ...update.backups ],
                });
            } else {
                merged.set(id, update);
            }
        }
        return merged;
    }

    /**
     * Converts runs, jobs or databases array to a Map for easier access by ID.
     * @param runs Array to convert from the backend
     * @return Map of elements keyed by their ID
     * @private
     */
    private static _arrayToMap<T extends { id: number }>(runs: T[]): Map<number, T> {
        return new Map(runs.map(run => [ run.id, run ]));
    }

    /**
     * Extracts backup IDs from runs map.
     * @param runs Map of runs to extract backup IDs from
     * @return Set of backup IDs
     * @private
     */
    private static _runsMapToBackupIds(runs: Map<number, Run>): Set<number> {
        return new Set(runs.values().flatMap(
            run => run.backups.map(backup => backup.id),
        ));
    }

    /**
     * Fetch the next page of backups from the API, and add them to the API store.
     * @param params Optional URLSearchParams to pass to the API, containing page filters.
     */
    async fetchNextPage(params?: URLSearchParams) {
        const lastBackupId = this.runs.at(-1)?.backups.at(-1)?.id;
        if (!lastBackupId || !this.isMoreAvailable) {
            return;
        }

        params ??= new URLSearchParams();
        params.set('cursor', lastBackupId.toString());
        params.set('limit', this._fetchLimit.toString());

        const res = await fetchApi<ApiRunsQueryResult>('GET', `/api/runs?${params}`, null);
        if (res.isErr()) {
            console.error('Failed to fetch next page of backups:', res.error);
            return;
        }

        const data = res.value;
        this._lastFetchedCount = data.runs.reduce((count, run) => count + run.backups.length, 0);
        this._apiRuns = BackupsStore._mergeRuns(this._apiRuns, BackupsStore._arrayToMap(data.runs));
        this._knownApiBackupIds = BackupsStore._runsMapToBackupIds(this._apiRuns);
        this._apiJobs = BackupsStore._arrayToMap([ ...this._apiJobs.values(), ...data.jobs ]);
        this._apiDatabases = BackupsStore._arrayToMap([ ...this._apiDatabases.values(), ...data.databases ]);
    }

    /**
     * Clear all fetched data from the API.
     * Useful when filters are changed.
     */
    resetApiData() {
        this._apiRuns = new Map();
        this._knownApiBackupIds = new Set();
        this._apiJobs = new Map();
        this._apiDatabases = new Map();
        this._lastFetchedCount = this._pageRuns.values().reduce((count, run) => count + run.backups.length, 0);
    }
}
