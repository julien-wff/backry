import { PostgresEngine } from '$lib/engines/PostgresEngine';

export const engines = {
    'postgresql': PostgresEngine,
} as const;

export const DATABASE_ENGINES = Object.keys(engines) as unknown as readonly [ keyof typeof engines ];

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
