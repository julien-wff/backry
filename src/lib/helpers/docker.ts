import { formatSize } from '$lib/helpers/format';

/**
 * Format and pretty-print Docker server information.
 * Converted from https://github.com/docker/cli/blob/0aedba58c2eb75e45b5dd56cbad16a6876a38af3/cli/command/system/info.go#L241 using a LLM
 * @param info Server information object from Docker API
 * @returns Formatted string with server information
 * @throws Error May throw errors if the input data is malformed
 */
export function prettyPrintServerInfo(info: any): string {
    let output = '';
    let errOutput = '';

    const EOL = '\n'; // End Of Line

    // Helper to append a line to the output
    const appendLine = (line: string): void => {
        output += line + EOL;
    };

    // Helper to append a line only if the value is non-empty
    const appendLineNonEmpty = (prefix: string, value: any): void => {
        if (value !== null && value !== undefined && value !== '' && value !== 0) {
            appendLine(`${prefix} ${value}`);
        }
    };

    // Helper to format a line with placeholders
    const formatLine = (format: string, ...args: any[]): void => {
        let line = format;
        for (const element of args) {
            // Replace %s or %d with the string representation of the element
            line = line.replace(/%[sd]/, String(element));
        }
        appendLine(line);
    };

    // Helper to join array elements with a separator
    const join = (arr: any[], separator: string): string => (arr || []).join(separator);

    // --- Main format logic ---

    appendLine(` Containers: ${info.Containers || 0}`);
    appendLine(`  Running: ${info.ContainersRunning || 0}`);
    appendLine(`  Paused: ${info.ContainersPaused || 0}`);
    appendLine(`  Stopped: ${info.ContainersStopped || 0}`);
    appendLine(` Images: ${info.Images || 0}`);

    appendLineNonEmpty(' Server Version:', info.ServerVersion);
    appendLineNonEmpty(' Storage Driver:', info.Driver);

    if (info.DriverStatus && Array.isArray(info.DriverStatus)) {
        for (const pair of info.DriverStatus) {
            if (Array.isArray(pair) && pair.length === 2) {
                formatLine('  %s: %s', pair[0], pair[1]);
            }
        }
    }

    if (info.SystemStatus && Array.isArray(info.SystemStatus)) {
        for (const pair of info.SystemStatus) {
            if (Array.isArray(pair) && pair.length === 2) {
                formatLine(' %s: %s', pair[0], pair[1]);
            }
        }
    }

    appendLineNonEmpty(' Logging Driver:', info.LoggingDriver);
    appendLineNonEmpty(' Cgroup Driver:', info.CgroupDriver);
    appendLineNonEmpty(' Cgroup Version:', info.CgroupVersion);

    appendLine(' Plugins:');
    appendLine(`  Volume: ${join(info.Plugins?.Volume, ' ')}`);
    appendLine(`  Network: ${join(info.Plugins?.Network, ' ')}`);

    if (info.Plugins?.Authorization?.length > 0) {
        appendLine(`  Authorization: ${join(info.Plugins.Authorization, ' ')}`);
    }

    appendLine(`  Log: ${join(info.Plugins?.Log, ' ')}`);

    if (info.CDISpecDirs?.length > 0) {
        appendLine(' CDI spec directories:');
        for (const dir of info.CDISpecDirs) {
            formatLine('  %s', dir);
        }
    }

    if (info.DiscoveredDevices?.length > 0) {
        appendLine(' Discovered Devices:');
        for (const device of info.DiscoveredDevices) {
            formatLine('  %s: %s', device.Source, device.ID);
        }
    }

    appendLine(` Swarm: ${info.Swarm?.LocalNodeState || ''}`);

    if (info.Runtimes && Object.keys(info.Runtimes).length > 0) {
        const names = Object.keys(info.Runtimes).toSorted((a, b) => a.localeCompare(b));
        appendLine(` Runtimes: ${join(names, ' ')}`);
        appendLine(` Default Runtime: ${info.DefaultRuntime || ''}`);
    }

    if (info.OSType === 'linux') {
        appendLine(` Init Binary: ${info.InitBinary || ''}`);
        appendLine(` containerd version: ${info.ContainerdCommit?.ID || ''}`);
        appendLine(` runc version: ${info.RuncCommit?.ID || ''}`);
        appendLine(` init version: ${info.InitCommit?.ID || ''}`);
    }

    // Isolation is only relevant on a Windows daemon.
    if (info.OSType === 'windows') {
        appendLine(` Default Isolation: ${info.Isolation || ''}`);
    }

    appendLineNonEmpty(' Kernel Version:', info.KernelVersion);
    appendLineNonEmpty(' Operating System:', info.OperatingSystem);
    appendLineNonEmpty(' OSType:', info.OSType);
    appendLineNonEmpty(' Architecture:', info.Architecture);
    appendLine(` CPUs: ${info.NCPU || 0}`);
    appendLine(` Total Memory: ${formatSize(info.MemTotal || 0)}`);
    appendLineNonEmpty(' Name:', info.Name);
    appendLineNonEmpty(' ID:', info.ID);
    appendLine(` Docker Root Dir: ${info.DockerRootDir || ''}`);
    appendLine(` Debug Mode: ${info.Debug ? 'true' : 'false'}`);

    appendLineNonEmpty(' HTTP Proxy:', info.HTTPProxy);
    appendLineNonEmpty(' HTTPS Proxy:', info.HTTPSProxy);
    appendLineNonEmpty(' No Proxy:', info.NoProxy);
    appendLineNonEmpty(' Username:', info.UserName);

    if (info.Labels?.length > 0) {
        appendLine(' Labels:');
        for (const lbl of info.Labels) {
            appendLine(`  ${lbl}`);
        }
    }

    appendLine(` Experimental: ${info.ExperimentalBuild ? 'true' : 'false'}`);

    const registryConfig = info.RegistryConfig;
    if (registryConfig) {
        const hasInsecureCIDRs = registryConfig.InsecureRegistryCIDRs?.length > 0;
        const hasInsecureIndexConfigs = Object.values(registryConfig.IndexConfigs || {})?.some((c: any) => !c.Secure);

        if (hasInsecureCIDRs || hasInsecureIndexConfigs) {
            appendLine(' Insecure Registries:');
            if (registryConfig.IndexConfigs) {
                for (const config of Object.values(registryConfig.IndexConfigs)) {
                    if (!(config as any).Secure) {
                        appendLine(`  ${(config as any).Name}`);
                    }
                }
            }

            if (registryConfig.InsecureRegistryCIDRs) {
                for (const cidr of registryConfig.InsecureRegistryCIDRs) {
                    formatLine('  %s', cidr);
                }
            }
        }

        if (registryConfig.Mirrors?.length > 0) {
            appendLine(' Registry Mirrors:');
            for (const mirror of registryConfig.Mirrors) {
                appendLine(`  ${mirror}`);
            }
        }
    }

    appendLine(` Live Restore Enabled: ${info.LiveRestoreEnabled ? 'true' : 'false'}`);

    if (info.ProductLicense !== '') {
        appendLine(` Product License: ${info.ProductLicense}`);
    }

    if (info.DefaultAddressPools?.length > 0) {
        appendLine(' Default Address Pools:');
        for (const pool of info.DefaultAddressPools) {
            formatLine('    Base: %s, Size: %d', pool.Base, pool.Size);
        }
    }

    if (info.FirewallBackend) {
        appendLine(` Firewall Backend: ${info.FirewallBackend.Driver || ''}`);
        if (info.FirewallBackend.Info && Array.isArray(info.FirewallBackend.Info)) {
            for (const v of info.FirewallBackend.Info) {
                if (Array.isArray(v) && v.length === 2) {
                    formatLine('  %s: %s', v[0], v[1]);
                }
            }
        }
    }

    if (info.Warnings?.length > 0) {
        for (const w of info.Warnings) {
            errOutput += w + EOL;
        }
    }
    if (errOutput.length > 0) {
        appendLine('');
        output += '\n--- Warnings ---\n' + errOutput;
    }

    return output;
}
