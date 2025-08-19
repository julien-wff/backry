PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`storage_id` integer NOT NULL,
	`cron` text NOT NULL,
	`prune_policy` text,
	FOREIGN KEY (`storage_id`) REFERENCES `storages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_jobs`("id", "name", "slug", "status", "created_at", "updated_at", "storage_id", "cron", "prune_policy") SELECT "id", "name", "slug", "status", "created_at", "updated_at", "storage_id", "cron", "prune_policy" FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;