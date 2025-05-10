<script lang="ts">
    import type { ContainerInspectInfo, ImageInspectInfo } from 'dockerode';

    interface Props {
        container: ContainerInspectInfo;
        image?: ImageInspectInfo;
    }

    let { container, image }: Props = $props();

    let composeName = $derived(
        container.Config.Labels?.['com.docker.compose.project'] || container.Config.Labels?.['com.docker.compose.service'],
    );
</script>

<div class="bg-base-100 p-2 mt-1 rounded-box mb-1 flex flex-row gap-2 items-center">
    <div class="flex-1">
        <div>
            {composeName ? `${composeName} >` : ''} {container.Name.slice(1)} ({container.Id.slice(0, 12)})
        </div>
        <div class="text-sm">
            Image: {image?.RepoTags[0] ?? '<unknown>'}
        </div>
    </div>
</div>
