<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ArrowDown, ArrowUp, Power, PowerOff, Trash2 } from '$lib/components/icons';

    interface Props {
        selection: Array<{ id: number, enabled: boolean }>;
        availableDatabases: Array<{ id: number, name: string }>;
    }

    let { selection = $bindable(), availableDatabases }: Props = $props();

    let canAddDatabases = $derived(selection.length < availableDatabases.length);
    let selectedDatabasesIds = $derived(selection.map(db => db.id));

    function handleAddDatabase() {
        selection = [
            ...selection,
            { id: -1, enabled: true },
        ];
    }

    function handleRemoveDatabase(index: number) {
        selection = selection.filter((_, i) => index != i);
    }

    function handleInvertDatabasesPositions(index1: number, index2: number) {
        const db = selection[index1];
        selection[index1] = selection[index2];
        selection[index2] = db;
    }
</script>


<InputContainer label="Databases">
    {#each selection as selectedDb, i}
        <!-- Can only select (non-selected in other databases) and (currently selected on) -->
        {@const localAvailableDbs = availableDatabases
            .filter(db => !selectedDatabasesIds.includes(db.id) || selectedDb.id === db.id)
        }

        <fieldset class="relative fieldset bg-base-100 border border-base-300 p-4 rounded-box">
            <legend class="fieldset-legend">Database #{i + 1}</legend>

            <div class="absolute right-4 -top-6 flex gap-2">
                <button type="button" class="btn btn-soft btn-xs"
                        class:btn-success={selectedDb.enabled}
                        class:btn-warning={!selectedDb.enabled}
                        onclick={() => (selection[i].enabled = !selectedDb.enabled)}>
                    {#if selectedDb.enabled}
                        <Power class="w-3 h-3"/>
                        Enabled
                    {:else}
                        <PowerOff class="w-3 h-3"/>
                        Disabled
                    {/if}
                </button>

                <button type="button" class="btn btn-soft btn-xs btn-square btn-info"
                        disabled={i === 0}
                        onclick={() => handleInvertDatabasesPositions(i, i - 1)}>
                    <ArrowUp class="w-3 h-3"/>
                </button>

                <button type="button" class="btn btn-soft btn-xs btn-square btn-info"
                        disabled={i === selection.length - 1}
                        onclick={() => handleInvertDatabasesPositions(i, i + 1)}>
                    <ArrowDown class="w-3 h-3"/>
                </button>

                <button type="button" class="btn btn-error btn-soft btn-xs"
                        onclick={() => handleRemoveDatabase(i)}>
                    <Trash2 class="w-3 h-3"/>
                    Remove
                </button>
            </div>

            <select class="select select-sm w-full" bind:value={selection[i].id} id="database-{i}" required>
                {#each localAvailableDbs as availableDb (availableDb.id)}
                    <option value={availableDb.id}>{availableDb.name}</option>
                {/each}
            </select>
        </fieldset>
    {/each}

    <button class="btn btn-primary btn-sm btn-soft"
            class:mt-1={selection.length > 0}
            disabled={!canAddDatabases}
            onclick={handleAddDatabase}
            type="button">
        Add database
    </button>
</InputContainer>
