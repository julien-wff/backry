<script lang="ts">
    import { CirclePlus, OctagonAlert } from '$lib/components/icons';
    import type { DockerConnectionStringRequest, DockerHostnamesCheckResponse } from '$lib/types/api';
    import type { ContainerInspectInfo, ImageInspectInfo } from 'dockerode';
    import { goto } from '$app/navigation';
    import type { DATABASE_ENGINES } from '$lib/db/schema';

    interface Props {
        container: ContainerInspectInfo;
        image?: ImageInspectInfo;
        engineId: string;
    }

    let { container, image, engineId }: Props = $props();

    let composeName = $derived(
        container.Config.Labels?.['com.docker.compose.project'] || container.Config.Labels?.['com.docker.compose.service'],
    );
    let canBeAdded = $derived(container.State.Running);

    let addDialog = $state<HTMLDialogElement | null>(null);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let hostnameScanResult = $state<DockerHostnamesCheckResponse | null>(null);
    let selectedHostName = $state<string | null>(null);

    async function showDialog() {
        addDialog?.showModal();
        loading = true;
        error = null;
        selectedHostName = null;

        const res = await fetch(`/api/integrations/docker/hostnames/${container.Id}`);
        const json: DockerHostnamesCheckResponse | { error: string } = await res.json();
        loading = false;

        if ('error' in json) {
            error = json.error;
            return;
        }

        hostnameScanResult = json;
    }

    async function getConnectionString() {
        const res = await fetch(`/api/integrations/docker/connection-string/${container.Id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                engine: engineId as typeof DATABASE_ENGINES[number],
                hostname: selectedHostName ? selectedHostName.split(':')[0] : 'hostname',
                port: selectedHostName ? parseInt(selectedHostName.split(':')[1]) : undefined,
            } satisfies DockerConnectionStringRequest),
        });
        if (!res.ok) {
            return null;
        }
        const { result } = await res.json();
        return result;
    }

    async function redirectToNewDatabase() {
        const name = container.Name.slice(1).replace(/[-_]/g, ' ').replace(/ +/g, ' ').trim();
        const connectionString = await getConnectionString();

        const params = new URLSearchParams({
            engine: engineId,
            name: name.slice(0, 1).toUpperCase() + name.slice(1),
        });

        if (connectionString) {
            params.set('connectionString', connectionString);
        }

        goto(`/databases/new?${params}`);
    }
</script>

<div class="mt-1 mb-1 flex flex-row items-center gap-2 p-2 bg-base-100 rounded-box">
    <div class="flex-1">
        <div class="flex flex-row items-center gap-2">
            <div class="capitalize badge badge-sm"
                 class:badge-error={container.State.Error}
                 class:badge-neutral={!container.State.Running && !container.State.Error}
                 class:badge-success={container.State.Running}>
                {container.State.Status}
            </div>
            <span>
                {composeName ? `${composeName} >` : ''} {container.Name.slice(1)} ({container.Id.slice(0, 12)})
            </span>
        </div>

        <div class="text-sm">
            Image: {image?.RepoTags[0] ?? '<unknown>'}
        </div>
    </div>

    {#if canBeAdded}
        <div class="flex items-center">
            <button class="btn btn-primary btn-soft btn-square" onclick={showDialog}>
                <CirclePlus class="h-6 w-6"/>
            </button>
        </div>
    {/if}
</div>


{#if canBeAdded}
    <dialog bind:this={addDialog} class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Add {container.Name.slice(1)} to databases</h3>

            {#if loading}
                <div role="alert" class="mt-4 alert alert-soft">
                    <span class="loading loading-spinner loading-sm"></span>
                    <span>Finding reachable hostnames...</span>
                </div>
            {:else if error}
                <div role="alert" class="alert alert-error alert-soft">
                    <OctagonAlert class="h-4 w-4"/>
                    <span>{error}</span>
                </div>
            {:else if hostnameScanResult}
                <div class="mt-4">Select the container hostname and port:</div>
                <div class="mt-2 flex flex-col gap-2">
                    {#each hostnameScanResult as hostname}
                        <label class="flex items-center gap-2">
                            <input type="radio"
                                   name="hostname"
                                   class="radio radio-sm"
                                   class:radio-primary={hostname.reachable}
                                   class:radio-error={!hostname.reachable}
                                   bind:group={selectedHostName}
                                   value="{hostname.host}:{hostname.port}"
                                   disabled={!hostname.reachable}>
                            <span class:opacity-70={!hostname.reachable}>
                                {hostname.host}:{hostname.port}
                                {#if !hostname.reachable}
                                    (unreachable)
                                {/if}
                            </span>
                        </label>
                    {/each}
                    <label class="flex items-center gap-2">
                        <input type="radio"
                               bind:group={selectedHostName}
                               name="hostname"
                               class="radio radio-sm radio-primary"
                               value="">
                        Manually input at next step
                    </label>
                </div>
            {/if}

            <div class="modal-action">
                <button class="btn" onclick={() => addDialog?.close()}>Cancel</button>
                <button class="btn btn-primary"
                        onclick={redirectToNewDatabase}
                        disabled={loading || selectedHostName === null}>
                    Continue
                </button>
            </div>
        </div>
    </dialog>
{/if}
