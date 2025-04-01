<script>
    import NavbarElement from '$lib/components/navbar/NavbarElement.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import Database from '@lucide/svelte/icons/database';
    import History from '@lucide/svelte/icons/history';
    import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
    import RefreshCw from '@lucide/svelte/icons/refresh-cw';
    import Settings from '@lucide/svelte/icons/settings';
    import Timer from '@lucide/svelte/icons/timer';
</script>

<aside class="flex flex-col gap-8 p-2 shadow-md bg-base-100 rounded-r-box">
    <a class="flex flex-col items-center gap-2" href="/">
        <span class="text-3xl">🍰</span>
        <span class="text-xl font-bold">Backry</span>
    </a>

    <nav class="flex flex-col flex-1 gap-4">
        <NavbarElement href="/dashboard" icon={LayoutDashboard} label="Dashboard"/>
        <NavbarElement href="/databases" icon={Database} label="Databases"/>
        <NavbarElement href="/storages" icon={CloudUpload} label="Storage"/>
        <NavbarElement href="/jobs" icon={Timer} label="Backup jobs"/>
        <NavbarElement href="/executions" icon={RefreshCw} label="Executions"/>
        <NavbarElement href="/restore" icon={History} label="Restore"/>

        <div class="flex flex-col justify-end flex-1">
            <NavbarElement href="/settings" icon={Settings} label="Settings"/>
        </div>
    </nav>
</aside>
