<script lang="ts">
    import { page } from '$app/state';
    import { type IconType } from '$lib/components/icons';

    interface Props {
        icon: typeof IconType;
        label: string;
        href: string;
        hasError?: boolean;
    }

    const { icon: Icon, label, href, hasError }: Props = $props();
</script>

<a class="flex flex-col items-center gap-2 p-2 hover:bg-base-300 rounded-box"
   class:bg-base-300={page.url.pathname.startsWith(href)}
   {href}>
    <div class="indicator">
        {#if hasError}
            <span class="indicator-item h-2 w-2 bg-error rounded-full"></span>
        {/if}

        <Icon size={24}/>
    </div>
    <span class="text-sm">{label}</span>
</a>
