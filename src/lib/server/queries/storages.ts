import { db } from '$lib/server/db';
import { storages } from '$lib/server/db/schema';
import type { StorageRequest } from '$lib/server/schemas/api';
import { eq } from 'drizzle-orm';

/**
 * Fetches a complete list of all storages with all fields.
 */
export const storagesList = () =>
    db.select().from(storages).orderBy(storages.name);

/**
 * Fetches a storage by ID.
 * @param id Storage ID.
 * @return Storage or null if not found.
 */
export const getStorage = (id: number) =>
    db
        .select()
        .from(storages)
        .where(eq(storages.id, id))
        .get();

/**
 * Creates a new storage from an HTTP request.
 * @param storage Fields from request body.
 */
export const createStorage = (storage: StorageRequest) => db
    .insert(storages)
    .values(storage)
    .returning()
    .get();

/**
 * Updates a storage by ID.
 * @param id Storage ID.
 * @param storage Fields from request body.
 */
export const updateStorage = (id: number, storage: Partial<typeof storages.$inferInsert>) =>
    db
        .update(storages)
        .set(storage)
        .where(eq(storages.id, id))
        .returning()
        .get();

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
