<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { slugify } from '$lib/helpers/format';

    interface Props {
        slug: string;
        baseValue: string;
        disabled?: boolean;
        source: 'database' | 'job';
    }

    let { slug = $bindable(), baseValue, disabled, source }: Props = $props();

    let oldBaseValue = $state(baseValue);
    $effect(() => updateSlug(baseValue));

    function updateSlug(_: string) {
        if (slugify(oldBaseValue) === slug && !disabled) {
            slug = slugify(baseValue);
        }
        oldBaseValue = baseValue;
    }
</script>


{#snippet slugHelp()}
    <p class="mb-1">
        The slug is used to name the backup file inside the Restic repository. The final format is:
    </p>
    <p class="input w-full mb-2">
        <code>
            <!-- Use comments to remove unwanted spaces -->
            /<span class="text-info">{'<'}job-slug{'>'}</span><!--
            -->_<span class="text-success">{'<'}database-slug{'>'}</span><!--
            -->.<span class="text-error">{'<'}ext{'>'}</span>
        </code>
    </p>
    <p>
        Once the {source} is created, the slug cannot be changed.
    </p>
{/snippet}


<InputContainer for="slug" helpContent={slugHelp} label="Slug">
    <input bind:value={slug}
           class="input w-full disabled:border-base-300"
           {disabled}
           id="slug"
           minlength="2"
           name="slug"
           pattern="^[a-z0-9\-]+$"
           required>
</InputContainer>
