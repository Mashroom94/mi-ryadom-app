CREATE TABLE `event_notification_claims` (
	`event_id` text NOT NULL,
	`device_id` text NOT NULL,
	`notified_at` integer NOT NULL,
	PRIMARY KEY(`event_id`, `device_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_event_notification_claims_device` ON `event_notification_claims` (`device_id`, `notified_at`);
