<script lang="ts">
    import { browser } from '$app/environment';
    import type { PrismEditor } from 'prism-code-editor';
    import { basicEditor } from 'prism-code-editor/setups';
    import type { EditorTheme } from 'prism-code-editor/themes';
    import { onMount } from 'svelte';
    import 'prism-code-editor/prism/languages/ejs';

    interface Props {
        value?: string;
    }

    let { value = $bindable() }: Props = $props();

    let isDarkMode = $state(browser && window.matchMedia('(prefers-color-scheme: dark)').matches);
    let editor = $state<PrismEditor<{ theme: EditorTheme }> | null>(null);
    let editorDiv = $state<HTMLDivElement | null>(null);

    function handleThemeChange(e: MediaQueryListEvent) {
        isDarkMode = e.matches;
        editor?.setOptions({
            theme: isDarkMode ? 'github-dark' : 'github-light',
        });
    }

    onMount(() => {
        editor = basicEditor(editorDiv!, {
            language: 'ejs',
            theme: !isDarkMode ? 'github-light' : 'github-dark',
            onUpdate: v => (value = v),
            value,
        });

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleThemeChange);

        return () => {
            editor?.remove();
            mediaQuery.removeEventListener('change', handleThemeChange);
        };
    });
</script>

<div bind:this={editorDiv}></div>
