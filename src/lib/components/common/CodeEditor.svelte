<script lang="ts">
    import { browser } from '$app/environment';
    import type { PrismEditor } from 'prism-code-editor';
    import { basicEditor } from 'prism-code-editor/setups';
    import type { EditorTheme } from 'prism-code-editor/themes';
    import { onMount } from 'svelte';
    import 'prism-code-editor/prism/languages/ejs';
    import 'prism-code-editor/prism/languages/json';

    interface Props {
        value?: string;
        language: 'ejs' | 'json';
        readonly?: boolean;
        interactive?: boolean;
    }

    let { value = $bindable(''), language, readonly, interactive = true }: Props = $props();

    let isDarkMode = $state(browser && window.matchMedia('(prefers-color-scheme: dark)').matches);
    let editor = $state<PrismEditor<{ theme: EditorTheme }> | null>(null);
    let editorDiv = $state<HTMLDivElement | null>(null);

    $effect(() => {
        if (editor && editor?.value !== value) {
            editor.setOptions({ value });
        }
    });

    $effect(() => {
        if (editor && interactive) {
            editor.textarea.style.pointerEvents = 'auto';
        } else if (editor) {
            editor.textarea.style.pointerEvents = 'inherit';
        }
    });

    function handleThemeChange(e: MediaQueryListEvent) {
        isDarkMode = e.matches;
        editor?.setOptions({
            theme: isDarkMode ? 'github-dark' : 'github-light',
        });
    }

    onMount(() => {
        editor = basicEditor(editorDiv!, {
            language,
            theme: !isDarkMode ? 'github-light' : 'github-dark',
            onUpdate: v => (value = v),
            value,
            readOnly: readonly,
            wordWrap: true,
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
