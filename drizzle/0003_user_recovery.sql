CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`recovery_hash` text,
	`pair_id` text,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `users_recovery_hash_unique` UNIQUE(`recovery_hash`)
);
--> statement-breakpoint
CREATE INDEX `idx_users_pair_id` ON `users` (`pair_id`);
--> statement-breakpoint
ALTER TABLE `devices` ADD `user_id` text;
--> statement-breakpoint
ALTER TABLE `devices` ADD `revoked_at` integer;
--> statement-breakpoint
INSERT INTO `users` (`id`, `recovery_hash`, `pair_id`, `name`, `created_at`, `updated_at`)
SELECT `id`, NULL, `pair_id`, `name`, `last_seen`, `last_seen` FROM `devices`;
--> statement-breakpoint
UPDATE `devices` SET `user_id` = `id` WHERE `user_id` IS NULL;
--> statement-breakpoint
CREATE INDEX `idx_devices_user_id` ON `devices` (`user_id`);
