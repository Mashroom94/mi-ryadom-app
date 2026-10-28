ALTER TABLE `users` ADD `email` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `password_salt` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token_hash` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `reset_expires_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_reset_token_hash_unique` ON `users` (`reset_token_hash`);
