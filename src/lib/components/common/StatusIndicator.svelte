<script lang="ts">
    import { CircleCheck, CirclePlay, CircleX, type IconType, OctagonAlert, Trash2 } from '$lib/components/icons';
    import { type BACKUP_STATUS, type ELEMENT_STATUS } from '$lib/server/db/schema';

    interface Props {
        status: typeof ELEMENT_STATUS[number] | typeof BACKUP_STATUS[number];
        tooltip?: string | null;
    }

    let { status, tooltip }: Props = $props();

    const STATUS_MAPPING: Record<typeof status, { label: string, icon: typeof IconType }> = {
        active: { label: 'Active', icon: CircleCheck },
        inactive: { label: 'Inactive', icon: CircleX },
        error: { label: 'Error', icon: OctagonAlert },
        running: { label: 'Running', icon: CirclePlay },
        success: { label: 'Success', icon: CircleCheck },
        pruned: { label: 'Pruned', icon: Trash2 },
    };

    const Icon = STATUS_MAPPING[status].icon;
</script>


<div class="tooltip grid place-items-center"
     class:tooltip-error={status === 'error'}
     class:tooltip-warning={status === 'pruned'}
     data-tip={tooltip}>
    <div class="badge badge-sm"
         class:badge-error={status === 'error'}
         class:badge-info={status === 'running'}
         class:badge-neutral={status === 'inactive'}
         class:badge-success={status === 'active' || status === 'success'}
         class:badge-warning={status === 'pruned'}>
        <Icon class="w-4 h-4"/>
        {STATUS_MAPPING[status].label}
    </div>
</div>

