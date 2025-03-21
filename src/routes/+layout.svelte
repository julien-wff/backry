<script lang="ts">
    import '../app.css';
    import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2';
    import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2';

    let { children } = $props();
</script>

<svelte:head>
    <link as="font" href={inter400} rel="preload" type="font/woff2">
    <link as="font" href={inter700} rel="preload" type="font/woff2">
</svelte:head>

{@render children()}
