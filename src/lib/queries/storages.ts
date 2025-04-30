import { db } from '$lib/db';
import { storages } from '$lib/db/schema';
import type { StoragesCreateRequest } from '$lib/types/api';
import { eq } from 'drizzle-orm';

/**
 * Fetches a complete list of all storages with all fields.
 */
export const storagesList = () => db.select().from(storages);

/**
 * Creates a new storage from an HTTP request.
 * @param storage Fields from request body.
 */
export const createStorage = (storage: StoragesCreateRequest) => db
    .insert(storages)
    .values(storage)
    .returning()
    .get();

/**
 * Fetches a list of all active storages ID and name.
 */
export const activeStoragesListShort = () =>
    db
        .select({
            id: storages.id,
            name: storages.name,
        })
        .from(storages)
        .where(eq(storages.status, 'active'));

/**
 * Deletes a storage by ID.
 * @param id Storage ID.
 * @return Deleted storage or null if not found.
 */
export const deleteStorage = (id: number) =>
    db
        .delete(storages)
        .where(eq(storages.id, id))
        .returning()
        .get();
