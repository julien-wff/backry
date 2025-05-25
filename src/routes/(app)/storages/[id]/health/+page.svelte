<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { FolderHeart } from '$lib/components/icons';
    import LocksDisplay from '$lib/components/storages/LocksDisplay.svelte';
    import PruneDesyncDisplay from '$lib/components/storages/PruneDesyncDisplay.svelte';
    import StaleSnapshotsDisplay from '$lib/components/storages/StaleSnapshotsDisplay.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="{data.storage.name} repository health"/>

<PageContentHeader buttonType="back" icon={FolderHeart}>
    {data.storage.name} Repository health
</PageContentHeader>

{#snippet locksHelpContent()}
    <p class="mb-2">
        Restic uses "locks" to prevent data corruption when multiple operations run at the same time on your backup
        repository. These locks are normally removed automatically once an operation finishes.
    </p>
    <p class="mb-2">
        Sometimes, if a Restic command crashes or is interrupted, these locks might not be removed. This can prevent new
        backups or other operations from running.
    </p>
    <p class="mb-2">
        If you encounter errors mentioning "repository is locked" during backups, you can use the button below to remove
        these leftover locks.
    </p>
    <p>
        For more details, see the
        <a href="https://restic.readthedocs.io/en/stable/100_references.html#locks"
           class="link link-primary"
           target="_blank"
           rel="noopener noreferrer">
            Restic documentation on locks
        </a>.
    </p>
{/snippet}

{#snippet staleSnapshotsHelpContent()}
    <p class="mb-2">
        Stale snapshots are Restic backups in your repository that Backry no longer recognizes. This can happen if a
        backup record was deleted from Backry but not from Restic, or if snapshots were made outside this Backry
        instance.
    </p>
    <p class="mb-2">
        Backry finds these by looking for Restic snapshots tagged "backry" that don't match any backup in its
        database. Snapshots without this tag are not checked.
    </p>
    <p>
        <strong>Warning:</strong> Deleting a stale snapshot here permanently removes the backup data from your Restic
        repository. Before deleting, be certain you no longer need this data or have a way to recover it if the
        unlinking from Backry was an error. Proceed with caution.
    </p>
{/snippet}

{#snippet pruneDesyncHelpContent()}
    <p class="mb-2">
        Backry automatically prunes backups based on the defined retention policy. This process involves deleting
        snapshots in Restic and updating Backry's database. However, the Restic repository is modified directly
        (e.g., using Restic commands outside of Backry), Backry's record of which backups are active or pruned might no
        longer match the actual state of your repository. This is a "desynchronization."
    </p>
    <p>
        This section helps resolve such mismatches. If Backry shows a backup as "active," but its snapshot no longer
        exists in the Restic repository (perhaps due to manual deletion or an external prune operation), you can use the
        button below to update Backry's status for that backup to "pruned," reflecting the repository's true state.
    </p>
{/snippet}


<ElementForm title="Repository health">
    <InputContainer helpContent={locksHelpContent} label="Locks">
        <LocksDisplay/>
    </InputContainer>

    <InputContainer helpContent={staleSnapshotsHelpContent} label="Stale snapshots">
        <StaleSnapshotsDisplay/>
    </InputContainer>

    <InputContainer helpContent={pruneDesyncHelpContent} label="Pruned backups desynchronization">
        <PruneDesyncDisplay/>
    </InputContainer>
</ElementForm>
