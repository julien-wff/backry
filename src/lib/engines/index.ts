import { PostgresEngine } from '$lib/engines/PostgresEngine';
import { SCHEMA_DATABASE_ENGINES } from '$lib/db/schema';

export const engines = {
    'postgresql': PostgresEngine,
} as const;

export const DATABASE_ENGINES = Object.keys(engines) as unknown as readonly [ keyof typeof engines ];

// Check engines in the schema (because drizzle doesn't support $lib import, so we have to do a copy of the list)
if (SCHEMA_DATABASE_ENGINES.length !== DATABASE_ENGINES.length) {
    throw new Error(`Engines in the schema and engines list do not match`);
}

for (const engine of SCHEMA_DATABASE_ENGINES) {
    if (!DATABASE_ENGINES.includes(engine)) {
        throw new Error(`Engine ${engine} is not implemented`);
    }
}

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
