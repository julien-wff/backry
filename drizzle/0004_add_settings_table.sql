CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`docker_uri` text,
	`setup_current_step` text DEFAULT 'welcome',
	`setup_complete` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_restores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backup_id` integer,
	`error` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`finished_at` text,
	`destination` text NOT NULL,
	`connection_string` text NOT NULL,
	`drop_database` integer DEFAULT false NOT NULL,
	`current_step` text DEFAULT 'check_backup' NOT NULL,
	`restore_logs` text,
	FOREIGN KEY (`backup_id`) REFERENCES `backups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_restores`("id", "backup_id", "error", "created_at", "updated_at", "finished_at", "destination", "connection_string", "drop_database", "current_step", "restore_logs") SELECT "id", "backup_id", "error", "created_at", "updated_at", "finished_at", "destination", "connection_string", "drop_database", "current_step", "restore_logs" FROM `restores`;--> statement-breakpoint
DROP TABLE `restores`;--> statement-breakpoint
ALTER TABLE `__new_restores` RENAME TO `restores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
