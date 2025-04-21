import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const ELEMENT_STATUS = [ 'active', 'inactive', 'error' ] as const;
export const DATABASE_ENGINES = [ 'postgresql-16' ] as const;
export const STORAGE_TYPES = [ 'local', 'custom' ] as const;

export const databases = sqliteTable('databases', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    engine: text('engine', { enum: DATABASE_ENGINES }).notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
    created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    connection_string: text('connection_string'),
    host: text('host'),
    port: integer('port'),
    database: text('database'),
    username: text('username'),
    password: text('password'),
});

export const databasesRelations = relations(databases, ({ many }) => ({
    jobsDatabases: many(jobDatabases),
}));

export const storages = sqliteTable('storages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: STORAGE_TYPES }).notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
    created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    url: text('url').notNull(),
    password: text('password'),
    env: text('env', { mode: 'json' }).notNull().default({}).$type<Record<string, string>>(),
});

export const storagesRelations = relations(storages, ({ many }) => ({
    jobs: many(jobs),
}));

export const jobs = sqliteTable('jobs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    storage_id: integer('storage_id').notNull().references(() => storages.id),
    cron: text('cron').notNull(),
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
    storage: one(storages, {
        fields: [ jobs.storage_id ],
        references: [ storages.id ],
    }),
    jobsDatabases: many(jobDatabases),
}));

export const jobDatabases = sqliteTable('job_databases', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    job_id: integer('job_id').notNull().references(() => jobs.id),
    database_id: integer('database_id').notNull().references(() => databases.id),
    created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
});

export const jobDatabasesRelations = relations(jobDatabases, ({ one, many }) => ({
    job: one(jobs, {
        fields: [ jobDatabases.job_id ],
        references: [ jobs.id ],
    }),
    database: one(databases, {
        fields: [ jobDatabases.database_id ],
        references: [ databases.id ],
    }),
    executions: many(executions),
}));

export const executions = sqliteTable('executions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    job_database_id: integer('job_database_id').notNull().references(() => jobDatabases.id),
    error: text('error'),
    started_at: text('started_at').default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    finished_at: text('finished_at'),
    dump_size: integer('dump_size'),
    dump_space_added: integer('dump_space_added'),
    duration: real('duration'),
    snapshot_id: text('snapshot_id'),
});

export const executionsRelations = relations(executions, ({ one }) => ({
    jobDatabase: one(jobDatabases, {
        fields: [ executions.job_database_id ],
        references: [ jobDatabases.id ],
    }),
}));
