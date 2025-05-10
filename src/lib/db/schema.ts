import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const ELEMENT_STATUS = [ 'active', 'inactive', 'error' ] as const;
export const DATABASE_ENGINES = [ 'postgresql', 'sqlite' ] as const;
export const BACKUP_STATUS = [ 'running', 'success', 'error' ] as const;
export const RUN_ORIGIN = [ 'manual', 'scheduled' ] as const;

export const databases = sqliteTable('databases', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    engine: text('engine', { enum: DATABASE_ENGINES }).notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    connectionString: text('connection_string').notNull(),
});

export const databasesRelations = relations(databases, ({ many }) => ({
    jobsDatabases: many(jobDatabases),
}));

export const storages = sqliteTable('storages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    error: text('error'),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    url: text('url').notNull(),
    password: text('password'),
    env: text('env', { mode: 'json' }).notNull().default({}).$type<Record<string, string>>(),
    diskSize: integer('disk_size'),
});

export const storagesRelations = relations(storages, ({ many }) => ({
    jobs: many(jobs),
}));

export const jobs = sqliteTable('jobs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    storageId: integer('storage_id').notNull().references(() => storages.id, { onDelete: 'cascade' }),
    cron: text('cron').notNull(),
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
    storage: one(storages, {
        fields: [ jobs.storageId ],
        references: [ storages.id ],
    }),
    jobsDatabases: many(jobDatabases),
}));

export const jobDatabases = sqliteTable(
    'job_databases',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
        databaseId: integer('database_id').notNull().references(() => databases.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
        createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
        updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
        status: text('status', { enum: ELEMENT_STATUS }).notNull().default('active'),
        error: text('error'),
    },
    t => [
        uniqueIndex('job_db_unique_idx').on(t.jobId, t.databaseId),
    ],
);

export const jobDatabasesRelations = relations(jobDatabases, ({ one, many }) => ({
    job: one(jobs, {
        fields: [ jobDatabases.jobId ],
        references: [ jobs.id ],
    }),
    database: one(databases, {
        fields: [ jobDatabases.databaseId ],
        references: [ databases.id ],
    }),
    backups: many(backups),
}));

export const runs = sqliteTable('runs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    origin: text('origin', { enum: RUN_ORIGIN }).notNull(),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    finishedAt: text('finished_at'),
    totalBackupsCount: integer('total_backups_count'),
    successfulBackupsCount: integer('successful_backups_count'),
});

export const runsRelations = relations(runs, ({ many }) => ({
    backups: many(backups),
}));

export const backups = sqliteTable('backups', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    jobDatabaseId: integer('job_database_id').notNull().references(() => jobDatabases.id, { onDelete: 'cascade' }),
    runId: integer('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    error: text('error'),
    startedAt: text('started_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    finishedAt: text('finished_at'),
    dumpSize: integer('dump_size'),
    dumpSpaceAdded: integer('dump_space_added'),
    duration: real('duration'),
    snapshotId: text('snapshot_id'),
});

export const backupsRelations = relations(backups, ({ one }) => ({
    jobDatabase: one(jobDatabases, {
        fields: [ backups.jobDatabaseId ],
        references: [ jobDatabases.id ],
    }),
    run: one(runs, {
        fields: [ backups.runId ],
        references: [ runs.id ],
    }),
}));
