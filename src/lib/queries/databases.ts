import { db } from '$lib/db';
import { databases, storages } from '$lib/db/schema';

export const databasesList = () => db.select().from(databases);

export const storagesList = () => db.select().from(storages);
