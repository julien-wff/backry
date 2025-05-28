<script lang="ts">
    interface Props {
        name: string;
        version: string | null;
        error: string | null;
        cmd: string | null;
        cmdResolved: string | null;
    }

    let { name, version, error, cmd, cmdResolved }: Props = $props();
</script>

<div class="flex flex-col gap-1">
    <div class="flex items-center gap-2 pl-1">
        <span class="status" class:status-error={error} class:status-success={version}></span>
        {name}
        {#if cmd}
            <div class="tooltip" class:tooltip-error={!cmdResolved}>
                <div class="tooltip-content max-w-2xl">
                    {cmdResolved ?? `Cannot resolve "${cmd}" in PATH`}
                </div>
                <span class="opacity-60 text-sm">({cmd})</span>
            </div>
        {/if}
    </div>

    <div class="w-full border border-base-300 rounded-box bg-base-100 overflow-x-auto">
        <div class="whitespace-pre-wrap font-mono p-2">{
            version || error
        }</div>
    </div>
</div>
