<script lang="ts">
    import { CircleHelp, Play, Timer } from '$lib/components/icons';
</script>

<div class="alert alert-vertical sm:alert-horizontal" role="alert">
    <CircleHelp class="w-5 h-5 text-secondary"/>
    <div class="flex flex-col gap-2">
        <div>
            Backups created by scheduled cron jobs will appear here once they run.
        </div>
        <div>
            To start a manual backup, go to the
            <a class="link link-primary" href="/jobs">
                <Timer class="inline w-4 h-4"/>
                jobs
            </a>
            page, and use the
            <button class="btn btn-sm btn-success" inert type="button">
                <Play class="w-4 h-4"/>
                Run now
            </button>
            button.
        </div>
    </div>
</div>
