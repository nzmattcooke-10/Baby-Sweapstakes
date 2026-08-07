CREATE TABLE `guess` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`birth_date` text,
	`birth_minute_of_day` integer,
	`weight_grams` integer,
	`length_mm` integer,
	`sex` text,
	`first_name` text,
	`committed_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guess_participant_id_unique` ON `guess` (`participant_id`);--> statement-breakpoint
CREATE TABLE `name_credit` (
	`participant_id` text PRIMARY KEY NOT NULL,
	`awarded_points` integer NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `participant` (
	`id` text PRIMARY KEY NOT NULL,
	`sweepstake_id` text NOT NULL,
	`display_name` text NOT NULL,
	`display_name_normalised` text NOT NULL,
	`avatar_key` text NOT NULL,
	`accent_color` text NOT NULL,
	`pin_hash` text NOT NULL,
	`pin_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`has_paid` integer DEFAULT false NOT NULL,
	`committed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participant_game_name_unique` ON `participant` (`sweepstake_id`,`display_name_normalised`);--> statement-breakpoint
CREATE TABLE `private_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `result` (
	`sweepstake_id` text PRIMARY KEY NOT NULL,
	`actual_date` text,
	`actual_minute_of_day` integer,
	`actual_weight_grams` integer,
	`actual_length_mm` integer,
	`actual_sex` text,
	`actual_name` text,
	`announced_at` integer
);
--> statement-breakpoint
CREATE TABLE `sweepstake` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`join_code` text NOT NULL,
	`admin_pin_hash` text NOT NULL,
	`due_date` text NOT NULL,
	`calendar_start` text NOT NULL,
	`calendar_end` text NOT NULL,
	`buy_in_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`default_units` text NOT NULL,
	`status` text NOT NULL,
	`names_released_at` integer,
	`scoring_weights` text NOT NULL,
	`created_at` integer NOT NULL
);
