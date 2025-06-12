<script lang="ts">
    import { page } from '$app/state';
    import { type IconType } from '$lib/components/icons';

    interface Props {
        icon: typeof IconType;
        label: string;
        href: string;
        hasError?: boolean;
        hasWarning?: boolean;
    }

    const { icon: Icon, label, href, hasError, hasWarning }: Props = $props();
</script>

<a class="flex flex-col items-center gap-2 p-2 hover:bg-base-300 rounded-box"
   class:bg-base-300={page.url.pathname.startsWith(href)}
   {href}>
    <div class="indicator">
        {#if hasError || hasWarning}
            <span class="indicator-item h-2 w-2 rounded-full"
                  class:bg-warning={hasWarning}
                  class:bg-error={hasError}></span>
        {/if}

        <Icon size={24}/>
    </div>
    <span class="text-sm">{label}</span>
</a>
