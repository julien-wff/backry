<script lang="ts">
    import { CircleHelp, Trash2 } from '$lib/components/icons';
    import {
        AVAILABLE_DELETE_POLICIES,
        compilePolicyToFlags,
        type DeletePolicies,
        type DeletePolicyIDs,
        parsePolicyFlags,
    } from '$lib/editors/delete-policy-edit';

    interface Props {
        opened: boolean;
        inputFieldArguments: string;
        cron: string;
        isCronValid: boolean;
    }

    let { opened, inputFieldArguments = $bindable(), cron, isCronValid }: Props = $props();

    let deletePolicies = $state<DeletePolicies>([]);
    let policyKeys = $derived(deletePolicies.map(([policyKey]) => policyKey));
    let remainingFlags = $state<string[]>([]);
    let canUpdate = $state(false);

    $effect(() => {
        if (opened) {
            const parseResult = parsePolicyFlags(inputFieldArguments);
            deletePolicies = parseResult.policies;
            remainingFlags = parseResult.remainingFlags;
            canUpdate = true;
        } else if (canUpdate) {
            inputFieldArguments = compilePolicyToFlags(deletePolicies, remainingFlags);
            canUpdate = false;
        }
    });

    function handlePolicyRemove(index: number) {
        deletePolicies = deletePolicies.filter((_, i) => i !== index);
    }

    function handlePolicyAdd() {
        const unassignedPolicy = Object
            .keys(AVAILABLE_DELETE_POLICIES)
            .find((policyId) => !policyKeys.includes(policyId as DeletePolicyIDs)) as DeletePolicyIDs;

        deletePolicies.push([unassignedPolicy, 10]);
    }
</script>

<div class="mb-4">
    <span class="font-bold">Policies definition:</span> keep-last will keep the last n backups. The others will keep
    the most recent backup for each period over the last n periods.
    <br/>
    For more information, see the
    <a class="link link-primary"
       href="https://restic.readthedocs.io/en/stable/060_forget.html#removing-snapshots-according-to-a-policy"
       rel="noopener noreferrer"
       target="_blank">
        Restic docs
    </a>.
</div>

{#if deletePolicies.length === 0}
    <div role="alert" class="alert  alert-soft mb-2">
        <CircleHelp size="16"/>
        <span>No policy, backups will not be deleted.</span>
    </div>
{/if}

{#each deletePolicies as [policyId], i (policyId)}
    <div class="mb-2 flex items-center gap-1">
        <div class="grid flex-1 grid-cols-4 gap-1">
            <select class="col-span-3 select" bind:value={deletePolicies[i][0]}>
                {#each Object.entries(AVAILABLE_DELETE_POLICIES) as [availablePolicyId, availablePolicyName] (availablePolicyId)}
                    <option value={availablePolicyId}
                            disabled={availablePolicyId !== policyId && policyKeys.includes(availablePolicyId as DeletePolicyIDs)}>
                        {availablePolicyName}
                    </option>
                {/each}
            </select>

            <input class="input"
                   placeholder="n"
                   type="number"
                   min="1"
                   bind:value={deletePolicies[i][1]}>
        </div>

        <button class="btn btn-error btn-soft btn-square" type="button" onclick={() => handlePolicyRemove(i)}>
            <Trash2 size="16"/>
        </button>
    </div>
{/each}

<button class="w-full btn btn-primary btn-soft btn-sm"
        disabled={deletePolicies.length >= Object.keys(AVAILABLE_DELETE_POLICIES).length}
        onclick={handlePolicyAdd}
        type="button">
    Add policy
</button>
