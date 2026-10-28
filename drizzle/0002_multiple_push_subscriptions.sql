CREATE TABLE `push_subscriptions_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `push_subscriptions_v2_endpoint_unique` UNIQUE(`endpoint`)
);
--> statement-breakpoint
CREATE INDEX `idx_push_subscriptions_v2_device` ON `push_subscriptions_v2` (`device_id`);
--> statement-breakpoint
INSERT INTO `push_subscriptions_v2` (`id`, `device_id`, `endpoint`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), `device_id`, `endpoint`, `created_at`, `created_at`
FROM `push_subscriptions`;
