import type { BaseEngine } from '$lib/engines/BaseEngine';
import { PostgresEngine } from '$lib/engines/PostgresEngine';
import { DATABASE_ENGINES } from '$lib/db/schema';
import { SQLiteEngine } from '$lib/engines/SQLiteEngine';

export const engines = {
    'postgresql': PostgresEngine,
    'sqlite': SQLiteEngine,
} as { [key in typeof DATABASE_ENGINES[number]]: new () => InstanceType<typeof BaseEngine> };

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
