<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import { Blocks, OctagonAlert } from '$lib/components/icons';
    import DetectedContainer from '$lib/components/integrations/docker/DetectedContainer.svelte';
    import { ENGINES_META } from '$lib/server/databases/engines-meta';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Docker integration"/>

<PageContentHeader icon={Blocks}>
    Docker integration
</PageContentHeader>

<ElementForm title="Found Docker containers">
    {#if data.error}
        <div role="alert" class="alert alert-error alert-soft">
            <OctagonAlert class="w-4 h-4"/>
            <span>Error: {data.error}</span>
        </div>
    {/if}

    {#each Object.entries(data.containers) as [engineId, containers]}
        {@const engine = ENGINES_META[engineId as keyof typeof ENGINES_META]}

        <div>
            <div class="flex items-center gap-2">
                <img src={engine.icon} alt={engine.displayName} class="w-4 h-4"/>
                {engine.displayName}
            </div>

            {#if containers.length === 0}
                <div role="alert" class="alert alert-soft mt-1">
                    <span>No container found</span>
                </div>
            {:else}
                {#each containers as container}
                    <DetectedContainer {container} image={data.images[container.Image]} {engineId}/>
                {/each}
            {/if}
        </div>
    {/each}
</ElementForm>
