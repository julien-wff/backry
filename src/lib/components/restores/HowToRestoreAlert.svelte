<script lang="ts">
    import { CircleHelp, EllipsisVertical, FileCheck, History } from '$lib/components/icons';
</script>

<div class="alert alert-vertical sm:alert-horizontal" role="alert">
    <CircleHelp class="w-5 h-5 text-secondary"/>
    <div>
        To restore a backup, go to the
        <a class="link link-primary" href="/backups">
            <FileCheck class="inline w-4 h-4"/>
            backups
        </a>
        page, and use the
        <button class="btn btn-sm btn-warning btn-soft" type="button">
            <History class="w-4 h-4"/>
            Restore
        </button>
        button under a backup's
        <button class="btn btn-square btn-sm btn-soft" type="button">
            <EllipsisVertical class="h-4 w-4"/>
        </button>
        actions menu.
    </div>
</div>
