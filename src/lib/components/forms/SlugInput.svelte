<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { slugify } from '$lib/helpers/format';

    interface Props {
        slug: string;
        baseValue: string;
    }

    let { slug = $bindable(), baseValue }: Props = $props();

    let oldBaseValue = $state(baseValue);
    $effect(() => updateSlug(baseValue));

    function updateSlug(_: string) {
        if (slugify(oldBaseValue) === slug) {
            slug = slugify(baseValue);
        }
        oldBaseValue = baseValue;
    }
</script>


<InputContainer for="slug" label="Slug">
    <input bind:value={slug}
           class="input w-full"
           id="slug"
           minlength="2"
           name="slug"
           pattern="^[a-z0-9\-]+$"
           required>
</InputContainer>
