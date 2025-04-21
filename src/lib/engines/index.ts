import { PostgresEngine } from '$lib/engines/PostgresEngine';

export const engines = {
    'postgresql': PostgresEngine,
} as const;

export const checkAllEngines = () => Promise.all(
    Object
        .keys(engines)
        .map(engine => checkEngine(engine as keyof typeof engines)),
);

async function checkEngine(id: keyof typeof engines) {
    const Engine = engines[id];
    const engine = new Engine();
    const version = await engine.getVersion();
    return { id, version };
}
