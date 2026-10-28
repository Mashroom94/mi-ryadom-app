CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text NOT NULL,
	`name` text NOT NULL,
	`pair_id` text,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_devices_pair_id` ON `devices` (`pair_id`);--> statement-breakpoint
CREATE TABLE `pair_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pair_codes_expires_at` ON `pair_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `partner_events` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_device_id` text NOT NULL,
	`receiver_device_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`delivered` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_partner_events_receiver_delivery` ON `partner_events` (`receiver_device_id`,`delivered`,`created_at`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`device_id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`created_at` integer NOT NULL
);
