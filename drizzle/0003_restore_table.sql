CREATE TABLE `restores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backup_id` integer,
	`error` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`finished_at` text,
	`destination` text NOT NULL,
	`connection_string` text NOT NULL,
	`drop_database` integer DEFAULT 0 NOT NULL,
	`current_step` text DEFAULT 'check_backup' NOT NULL,
	`restore_logs` text,
	FOREIGN KEY (`backup_id`) REFERENCES `backups`(`id`) ON UPDATE no action ON DELETE set null
);
