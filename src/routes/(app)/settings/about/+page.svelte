<script>
    import { PUBLIC_BUILD_DATE, PUBLIC_VCS_REF, PUBLIC_VERSION } from '$env/static/public';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { Settings } from '$lib/components/icons.js';
    import { formatUtcDate } from '$lib/helpers/format.js';
</script>

<Head title="Settings - Tools info"/>

<PageContentHeader buttonText="Back to settings" buttonType="back" icon={Settings}>
    Settings - About Backry
</PageContentHeader>


<div class="mx-auto flex w-full max-w-xl flex-col gap-4 p-4 rounded-box bg-base-200">
    <h2 class="text-lg font-bold">
        About Backry
    </h2>

    <p>
        Backry version
        <a class="link link-primary" href="https://github.com/julien-wff/backry/releases/tag/{PUBLIC_VERSION}"
           rel="noreferrer noopener">
            {PUBLIC_VERSION || 'dev'}
        </a>
        ({PUBLIC_VCS_REF?.slice(0, 7) || 'local'}),
        built on {formatUtcDate(PUBLIC_BUILD_DATE || new Date().toUTCString())}.
        <br/>
        Source code is available on
        <a class="link link-primary" href="https://github.com/julien-wff/backry" rel="noreferrer noopener">GitHub</a>.
    </p>

    <p>
        Thank you for using Backry!
        <br/>
        Hope you like it as much as I like building it! ❤️
    </p>
</div>
