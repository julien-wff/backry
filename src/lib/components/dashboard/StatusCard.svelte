<script lang="ts">
    import { type IconType } from '$lib/components/icons';

    interface Props {
        title: string;
        icon: typeof IconType;
        href: string;
        active?: number;
        inactive?: number;
        error?: number;
    }

    let { title, icon: Icon, href, active, inactive, error }: Props = $props();
</script>


<a class="w-full bg-base-100 rounded-box p-4" {href}>
    <div class="flex items-center gap-2">
        <Icon size={24}/>
        <h3 class="text-lg font-bold">
            {title}
        </h3>
    </div>

    {#snippet status(text: string, value: number | undefined, statusClass: string)}
        {#if value}
            <div class="flex items-center justify-between gap-2 bg-base-200 p-2 rounded-box">
                <span>
                    {value} {text}
                </span>
                <span class="status {statusClass} status-lg"></span>
            </div>
        {/if}
    {/snippet}

    {#if active || inactive || error}
        <div class="flex flex-col gap-2 mt-4">
            {@render status('Active', active, 'status-success')}
            {@render status('Inactive', inactive, 'status-neutral')}
            {@render status('Error', error, 'status-error')}
        </div>
    {/if}
</a>
