export const AVAILABLE_PRUNE_POLICIES = {
    'keep-last': 'Keey last n',
    'keep-hourly': 'Keep first of hour for last n hours',
    'keep-daily': 'Keep first of day for last n days',
    'keep-weekly': 'Keep first of week for last n weeks',
    'keep-monthly': 'Keep first of month for last n months',
    'keep-yearly': 'Keep first of year for last n years',
} as const;

export type PrunePolicyIDs = keyof typeof AVAILABLE_PRUNE_POLICIES;
export type PrunePolicies = Array<[ PrunePolicyIDs, number ]>;

/**
 * Parse the flags from the command line into a PrunePolicies array.
 * @param flags CLI arguments
 * @returns The parsed policies and the flags that could not be parsed
 */
export function parsePolicyFlags(flags: string) {
    const flagsSplit = flags.split(/[= ]+/g).filter(Boolean);
    const policies: PrunePolicies = [];
    let remainingFlags: string[] = [];

    let flagParsing: string | null = null;
    for (const flagFromSplit of flagsSplit) {
        // If the flag is a policy flag, keep it for next iteration with its value
        const flagFromSplitWithoutPrefix = flagFromSplit.slice(2);
        if (Object.keys(AVAILABLE_PRUNE_POLICIES).includes(flagFromSplitWithoutPrefix)) {
            flagParsing = flagFromSplitWithoutPrefix;
            continue;
        }

        // If the value is valid, set it to the policy
        // Otherwise, add it to the unknown remaining flags
        const value = parseInt(flagFromSplit, 10);
        if (flagParsing && !isNaN(value)) {
            // If the flag is already present in the policies, overwrite it
            const index = policies.findIndex(([ key ]) => key === flagParsing);
            if (index !== -1) {
                policies[index][1] = value;
            } else {
                policies.push([ flagParsing as PrunePolicyIDs, value ]);
            }
        } else {
            if (flagParsing) {
                remainingFlags.push(`--${flagParsing}`);
            }
            remainingFlags.push(flagFromSplit);
        }

        flagParsing = null;
    }

    return { policies, remainingFlags };
}

/**
 * Compile the policy into a string of flags for the command line.
 * @param policies The policy list to compile
 * @param additionalFlags Additional flags to add to the command line
 * @returns The compiled flags as a string
 */
export function compilePolicyToFlags(policies: PrunePolicies, additionalFlags: string[] = []) {
    const flags: string[] = [];

    for (const [ key, value ] of policies) {
        if (value > 0) {
            flags.push(`--${key} ${value}`);
        }
    }
    flags.push(...additionalFlags);

    return flags.join(' ');
}
