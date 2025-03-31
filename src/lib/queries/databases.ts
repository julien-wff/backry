import { db } from '$lib/db';
import { databases } from '$lib/db/schema';

export const databasesList = () => db.select().from(databases);
