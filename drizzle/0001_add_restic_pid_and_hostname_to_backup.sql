ALTER TABLE `backups` ADD `restic_pid` integer;--> statement-breakpoint
ALTER TABLE `backups` ADD `restic_hostname` text NOT NULL;