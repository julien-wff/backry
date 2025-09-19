import { apiError, apiSuccess } from '$lib/server/api/responses';
import type { DockerHostnamesCheckResponse } from '$lib/server/schemas/api';
import { inspectContainer } from '$lib/server/services/docker';
import { isPortReachable } from '$lib/server/services/net';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    const containerInfos = await inspectContainer(params.id);
    if (containerInfos.isErr()) {
        return apiError(containerInfos.error, 500);
    }

    const internalPorts = [ ...new Set([
        ...Object.keys(containerInfos.value.NetworkSettings?.Ports ?? {}),
        ...Object.keys(containerInfos.value.Config?.ExposedPorts ?? {}),
    ]) ]
        .map(p => parseInt(p.split('/')[0]))
        .filter(p => !isNaN(p));
    const internalHostNames = [
        ...new Set([
            containerInfos.value.NetworkSettings.IPAddress,
            ...Object.values(containerInfos.value.NetworkSettings.Networks).map(net => net.IPAddress),
            ...Object.values(containerInfos.value.NetworkSettings.Networks).map(net => net.Aliases as string[]),
            //@ts-expect-error DNSNames is currently not typed in dockerode
            ...Object.values(containerInfos.value.NetworkSettings.Networks).map(net => net.DNSNames as string[]),
        ].flat()),
    ].filter(Boolean);

    const externalPorts = Object.values(containerInfos.value.NetworkSettings.Ports)
        .flat()
        .map(p => parseInt(p?.HostPort ?? ''))
        .filter(p => !isNaN(p));
    const externalHostNames = [ 'localhost' ];

    const ips = await Promise.all([
        ...internalHostNames.map(host => internalPorts.map(port => ({ host, port }))).flat(),
        ...externalHostNames.map(host => externalPorts.map(port => ({ host, port }))).flat(),
    ].map(async ip => ({
        ...ip,
        reachable: await isPortReachable(ip.port, ip.host),
    }))) satisfies DockerHostnamesCheckResponse['ips'];

    return apiSuccess<DockerHostnamesCheckResponse>({ ips });
};
