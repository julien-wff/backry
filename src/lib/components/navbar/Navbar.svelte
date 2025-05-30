<script lang="ts">
    import { Blocks, CloudUpload, Database, FileCheck, LayoutDashboard, Settings, Timer } from '$lib/components/icons';
    import NavbarElement from '$lib/components/navbar/NavbarElement.svelte';

    interface Props {
        errors: {
            databases: number;
            storages: number;
            backups: number;
            notifications: number;
            tools: boolean;
        };
    }

    const { errors }: Props = $props();
</script>

<aside class="sticky top-0 flex h-screen flex-col gap-8 overflow-y-auto p-2 shadow-md bg-base-100 rounded-r-box">
    <a class="flex flex-col items-center gap-2" href="/">
        <span class="text-3xl">🍰</span>
        <span class="text-xl font-bold">Backry</span>
    </a>

    <nav class="flex flex-1 flex-col gap-4">
        <NavbarElement href="/dashboard" icon={LayoutDashboard} label="Dashboard"/>
        <NavbarElement hasError={errors.databases > 0} href="/databases" icon={Database} label="Databases"/>
        <NavbarElement hasError={errors.storages > 0} href="/storages" icon={CloudUpload} label="Storage"/>
        <NavbarElement href="/jobs" icon={Timer} label="Jobs"/>
        <NavbarElement hasError={errors.backups > 0} href="/backups" icon={FileCheck} label="Backups"/>
        <!--        <NavbarElement href="/restore" icon={History} label="Restore"/>-->

        <div class="flex flex-1 flex-col gap-4 justify-end">
            <NavbarElement href="/integrations/docker" icon={Blocks} label="Integrations"/>
            <NavbarElement hasError={errors.tools || errors.notifications > 0}
                           href="/settings"
                           icon={Settings}
                           label="Settings"/>
        </div>
    </nav>
</aside>
