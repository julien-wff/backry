<script lang="ts">
    import { CirclePlus, DatabaseBackup, History } from '$lib/components/icons.js';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import type { PageProps } from './$types.js';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ENGINES_META } from '$lib/common/engines-meta';
    import { OctagonAlert } from '$lib/components/icons';
    import RestoreConfirmModal from '$lib/components/restores/RestoreConfirmModal.svelte';
    import type { ModalControls } from '$lib/helpers/modal';
    import DropExistingModal from '$lib/components/restores/DropExistingModal.svelte';

    let { data }: PageProps = $props();

    const engineMeta = $derived(ENGINES_META[data.backup.jobDatabase.database.engine]);

    let selectedDestination = $state<'current' | 'other' | null>(null);
    let otherConnectionString = $state<string>('');
    let dropDatabase = $state<boolean>(false);

    let confirmModalControls = $state<ModalControls>();
    let dropModalControls = $state<ModalControls>();

    async function handleFormSubmit() {
        confirmModalControls?.open();
    }

    function handleDropInputToggle() {
        if (!dropDatabase) {
            return;
        }

        dropDatabase = false;
        dropModalControls?.open();
    }

    function handleDropAccept() {
        dropDatabase = true;
    }
</script>

<Head title="Restore backup"/>

<PageContentHeader buttonText="Cancel" buttonType="back" icon={History}>
    Restore backup
</PageContentHeader>

{#if selectedDestination}
    <RestoreConfirmModal backup={data.backup}
                         sourceDatabase={data.backup.jobDatabase.database}
                         sourceJobName={data.backup.jobDatabase.job.name}
                         bind:controls={confirmModalControls}
                         {selectedDestination}
                         {otherConnectionString}
                         {dropDatabase}/>
{/if}

<DropExistingModal bind:controls={dropModalControls} {engineMeta} ondropaccept={handleDropAccept}/>

<ElementForm onsubmit={handleFormSubmit}
             title="Restore {engineMeta.displayName} backup ({data.backup.jobDatabase.job.name} - {data.backup.jobDatabase.database.name})">
    <div class="alert alert-warning alert-soft" role="alert">
        <OctagonAlert class="h-4 w-4"/>
        <span>
            This is a destructive operation on the destination database. Make sure you have a recent backup before proceeding.
        </span>
    </div>

    <InputContainer label="Destination">
        <div class="flex gap-2">
            <button aria-pressed={selectedDestination === 'current'}
                    class="flex-1 gap-2 px-4 py-2 flex flex-col items-center bg-base-300 justify-center rounded-lg cursor-pointer border-2"
                    class:border-primary={selectedDestination === 'current'}
                    class:border-transparent={selectedDestination !== 'current'}
                    onclick={() => {
                        selectedDestination = 'current';
                    }}
                    type="button">
                <DatabaseBackup class="w-8 h-8"/>
                {data.backup.jobDatabase.database.name}
            </button>

            <button aria-pressed={selectedDestination === 'other'}
                    class="flex-1 gap-2 px-4 py-2 flex flex-col items-center bg-base-300 justify-center rounded-lg cursor-pointer border-2"
                    class:border-primary={selectedDestination === 'other'}
                    class:border-transparent={selectedDestination !== 'other'}
                    onclick={() => {
                        selectedDestination = 'other';
                    }}
                    type="button">
                <CirclePlus class="w-8 h-8"/>
                Other destination
            </button>
        </div>
    </InputContainer>

    {#if selectedDestination === 'other'}
        <InputContainer for="connection-string" label="Connection string">
            <input bind:value={otherConnectionString}
                   class="input w-full"
                   id="connection-string"
                   minlength="2"
                   name="connectionString"
                   placeholder={engineMeta.connectionStringPlaceholder}
                   required>
        </InputContainer>
    {/if}

    <InputContainer for="drop-db" label="Drop existing database">
        <label class="label">
            <input bind:checked={dropDatabase}
                   class="toggle toggle-primary"
                   id="drop-db"
                   onchange={handleDropInputToggle}
                   type="checkbox"/>
            Drop and recreate the database before restoring
        </label>
    </InputContainer>

    <button class="btn btn-primary" disabled={selectedDestination === null} type="submit">Next</button>
</ElementForm>
