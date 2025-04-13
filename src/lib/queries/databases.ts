import { db } from '$lib/db';
import { databases, storages } from '$lib/db/schema';
import type { StoragesCreateRequest } from '$lib/types/api';

export const databasesList = () => db.select().from(databases);

export const storagesList = () => db.select().from(storages);

export const createStorage = (storage: StoragesCreateRequest) => db
    .insert(storages)
    .values(storage)
    .returning()
    .get();
