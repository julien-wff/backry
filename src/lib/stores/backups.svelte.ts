import type { RunsQueryResult } from '$lib/server/schemas/api';
import { fetchApi, subscribeApi } from '$lib/helpers/fetch';
import type { BackupUpdateEventPayload } from '$lib/server/shared/events';
import { invalidateAll } from '$app/navigation';

type Run = RunsQueryResult['runs'][number];

export class BackupsStore {
    // Page runs (coming from +page.server.ts)
    private _pageRuns: Map<number, Run>;
    private readonly _knownPageBackupIds: Set<number>;
    private readonly _pageJobs: RunsQueryResult['jobs'];
    private readonly _pageDatabases: RunsQueryResult['databases'];

    // API runs (coming from page scroll)
    private _apiRuns = $state<Map<number, Run>>(new Map());
    private _knownApiBackupIds = new Set();
    private _apiJobs = $state<RunsQueryResult['jobs']>(new Map());
    private _apiDatabases = $state<RunsQueryResult['databases']>(new Map());

    // Shared data
    private readonly _jobs: RunsQueryResult['jobs'];
    private readonly _databases: RunsQueryResult['databases'];
    private _fetchLimit: number;

    // Derived values
    readonly backupCount;

    // Getters
    get runs() {
        return [ ...BackupsStore._mergeRuns(this._pageRuns, this._apiRuns).values() ];
    }

    get databases() {
        return this._databases;
    }

    // Methods
    constructor(data: () => RunsQueryResult) {
        // Page data
        this._pageRuns = $derived(BackupsStore._arrayToMap(data().runs));
        this._knownPageBackupIds = $derived(BackupsStore._runsMapToBackupIds(this._pageRuns));
        this._pageJobs = $derived(data().jobs);
        this._pageDatabases = $derived(data().databases);

        // Shared data
        this._fetchLimit = data().limit;
        this.backupCount = $derived(
            this._pageRuns.values().reduce((count, run) => count + run.backups.length, 0)
            + this._apiRuns.values().reduce((count, run) => count + run.backups.length, 0),
        );
        this._jobs = $derived(BackupsStore._arrayToMap([ ...this._pageJobs.values(), ...this._apiJobs.values() ]));
        this._databases = $derived(BackupsStore._arrayToMap([ ...this._pageDatabases.values(), ...this._apiDatabases.values() ]));
    }

    getRunJob(run: RunsQueryResult['runs'][number]) {
        return this._jobs.get(run.jobId);
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
        // TODO: Live update doesn't work
        // TODO: An update on an API backup would call invalidateAll() indefinitely
        if (!this._knownPageBackupIds.has(chunk.id) && !this._knownApiBackupIds.has(chunk.id)) {
            // If the backup is not known, it means it's a new one, so get it via page load function
            void invalidateAll();
            // Add it to the known page backups to avoid re-triggering invalidation
            this._knownPageBackupIds.add(chunk.id);
        } else if (this._knownPageBackupIds.has(chunk.id)) {
            // If the backup is known in the page runs, update it
            console.log('Updating backup in page runs:', chunk.id);
            this._pageRuns = BackupsStore._updateRunBackup(this._pageRuns, chunk);
        } else if (this._knownApiBackupIds.has(chunk.id)) {
            // If the backup is known in the API runs, update it
            this._apiRuns = BackupsStore._updateRunBackup(this._apiRuns, chunk);
        }
    }

    private static _updateRunBackup(runs: Map<number, Run>, chunk: BackupUpdateEventPayload) {
        const run = runs.values().find(run => run.backups.some(backup => backup.id === chunk.id));
        if (!run) {
            return runs;
        }

        runs.set(run.id, {
            ...run,
            backups: run.backups.map(backup => (backup.id === chunk.id ? { ...backup, ...chunk } : backup)),
        });
        return runs;
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

    async fetchNextPage(params?: URLSearchParams) {
        const lastBackupId = this.runs.at(-1)?.backups.at(-1)?.id;
        if (!lastBackupId) {
            return;
        }

        params ??= new URLSearchParams();
        params.set('cursor', lastBackupId.toString());
        params.set('limit', this._fetchLimit.toString());

        const res = await fetchApi<RunsQueryResult>('GET', `/api/runs?${params}`, null);
        if (res.isErr()) {
            console.error('Failed to fetch next page of backups:', res.error);
            return;
        }

        const data = res.value;
        this._apiRuns = BackupsStore._mergeRuns(this._apiRuns, BackupsStore._arrayToMap(data.runs));
        this._knownApiBackupIds = BackupsStore._runsMapToBackupIds(this._apiRuns);
        // TODO: no job or database is returned from the API
        this._apiJobs = BackupsStore._arrayToMap([ ...this._apiJobs.values(), ...data.jobs.values() ]);
        this._apiDatabases = BackupsStore._arrayToMap([ ...this._apiDatabases.values(), ...data.databases.values() ]);
    }
}
