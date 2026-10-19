import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import type { DockerHostnamesCheckResponse } from '#lib/server/schemas/api.ts';
import { getDockerEngineFromSettings, inspectContainer } from '#lib/server/services/docker.ts';
import { isPortReachable } from '#lib/server/services/net.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    const docker = await getDockerEngineFromSettings();
    if (docker.isErr()) {
        return apiError(docker.error, 503);
    }

    const containerInfos = await inspectContainer(docker.value, params.id);
    if (containerInfos.isErr()) {
        return apiError(containerInfos.error, 500);
    }

    const internalPorts = [
        ...new Set([
            ...Object.keys(containerInfos.value.NetworkSettings?.Ports ?? {}),
            ...Object.keys(containerInfos.value.Config?.ExposedPorts ?? {}),
        ]),
    ]
        .map((p) => parseInt(p.split('/')[0]))
        .filter((p) => !isNaN(p));
    const internalHostNames = [
        ...new Set(
            [
                // @ts-expect-error IPAddress may be returned by Docker but is not typed in dockerode.
                containerInfos.value.NetworkSettings.IPAddress,
                ...Object.values(containerInfos.value.NetworkSettings.Networks).map(
                    (net) => net.IPAddress,
                ),
                ...Object.values(containerInfos.value.NetworkSettings.Networks).map(
                    (net) => net.Aliases as string[],
                ),
                ...Object.values(containerInfos.value.NetworkSettings.Networks).map(
                    // @ts-expect-error DNSNames is returned by Docker but is not typed in dockerode.
                    (net) => net.DNSNames as string[],
                ),
            ].flat(),
        ),
    ].filter(Boolean);

    const externalPorts = [
        ...new Set(
            Object.values(containerInfos.value.NetworkSettings.Ports)
                .flat()
                .map((p) => parseInt(p?.HostPort ?? ''))
                .filter((p) => !isNaN(p)),
        ),
    ];
    const externalHostNames = [ 'localhost' ];

    const ips = (await Promise.all(
        [
            ...internalHostNames.flatMap((host) =>
                internalPorts.map((port) => ({ host, port })),
            ),
            ...externalHostNames.flatMap((host) =>
                externalPorts.map((port) => ({ host, port })),
            ),
        ].map(async (ip) => ({
            ...ip,
            reachable: await isPortReachable(ip.port, ip.host),
        })),
    )) satisfies DockerHostnamesCheckResponse['ips'];

    return apiSuccess<DockerHostnamesCheckResponse>({ ips });
};
