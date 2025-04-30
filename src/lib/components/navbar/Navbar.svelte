<script lang="ts">
    import { CloudUpload, Database, LayoutDashboard, RefreshCw, Settings, Timer } from '$lib/components/icons';
    import NavbarElement from '$lib/components/navbar/NavbarElement.svelte';

    interface Props {
        errors: {
            databases: boolean;
            storages: boolean;
            executions: boolean;
        };
    }

    const { errors }: Props = $props();
</script>

<aside class="flex flex-col gap-8 p-2 shadow-md bg-base-100 rounded-r-box">
    <a class="flex flex-col items-center gap-2" href="/">
        <span class="text-3xl">🍰</span>
        <span class="text-xl font-bold">Backry</span>
    </a>

    <nav class="flex flex-col flex-1 gap-4">
        <NavbarElement href="/dashboard" icon={LayoutDashboard} label="Dashboard"/>
        <NavbarElement hasError={errors.databases} href="/databases" icon={Database} label="Databases"/>
        <NavbarElement hasError={errors.storages} href="/storages" icon={CloudUpload} label="Storage"/>
        <NavbarElement href="/jobs" icon={Timer} label="Backup jobs"/>
        <NavbarElement hasError={errors.executions} href="/executions" icon={RefreshCw} label="Executions"/>
        <!--        <NavbarElement href="/restore" icon={History} label="Restore"/>-->

        <div class="flex flex-col justify-end flex-1">
            <NavbarElement href="/settings" icon={Settings} label="Settings"/>
        </div>
    </nav>
</aside>
