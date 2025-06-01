<script lang="ts">
    interface Props {
        elements: Array<{
            id: number;
            name: string;
            disabled?: boolean;
        }>;
        emptyText?: string;
    }

    let { elements, emptyText = 'None' }: Props = $props();
</script>


{#snippet elementsListFormatted()}
    <div>
        {#each elements as element, index (element.id)}
            <span class:line-through={element.disabled}>
                {element.name}
            </span>{index < elements.length - 1 ? ', ' : ''}
        {/each}
    </div>
{/snippet}


{#if elements.length === 0}
    {emptyText}
{:else if elements.length <= 2}
    {@render elementsListFormatted()}
{:else}
    <div class="tooltip">
        <div class="tooltip-content">
            {@render elementsListFormatted()}
        </div>
        <div>
            <span class:line-through={elements[0].disabled}>
                {elements[0].name}
            </span>
            + {elements.length - 1} more
        </div>
    </div>
{/if}
