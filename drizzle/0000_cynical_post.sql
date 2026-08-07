CREATE TYPE "public"."sex" AS ENUM('boy', 'girl');--> statement-breakpoint
CREATE TYPE "public"."sweepstake_status" AS ENUM('open', 'closed', 'revealed');--> statement-breakpoint
CREATE TABLE "guess" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"birth_date" date,
	"birth_minute_of_day" smallint,
	"weight_grams" integer,
	"length_mm" integer,
	"sex" "sex",
	"first_name" text,
	"hot_take" text,
	"committed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guess_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
CREATE TABLE "name_credit" (
	"participant_id" uuid PRIMARY KEY NOT NULL,
	"awarded_points" smallint NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sweepstake_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar_key" text NOT NULL,
	"accent_color" text NOT NULL,
	"pin_hash" text NOT NULL,
	"pin_attempts" smallint DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"has_paid" boolean DEFAULT false NOT NULL,
	"committed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result" (
	"sweepstake_id" uuid PRIMARY KEY NOT NULL,
	"actual_date" date,
	"actual_minute_of_day" smallint,
	"actual_weight_grams" integer,
	"actual_length_mm" integer,
	"actual_sex" "sex",
	"actual_name" text,
	"announced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sweepstake" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"join_code" text NOT NULL,
	"admin_pin_hash" text NOT NULL,
	"due_date" date NOT NULL,
	"calendar_start" date NOT NULL,
	"calendar_end" date NOT NULL,
	"buy_in_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'NZD' NOT NULL,
	"default_units" text DEFAULT 'metric' NOT NULL,
	"status" "sweepstake_status" DEFAULT 'open' NOT NULL,
	"names_released_at" timestamp with time zone,
	"scoring_weights" jsonb DEFAULT '{"date":{"max":30,"perDay":5},"weight":{"max":25,"per50g":1},"name":{"max":20},"time":{"max":15,"per30min":1},"sex":{"max":10},"length":{"max":10,"per5mm":1}}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sweepstake_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
ALTER TABLE "guess" ADD CONSTRAINT "guess_participant_id_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "name_credit" ADD CONSTRAINT "name_credit_participant_id_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_sweepstake_id_sweepstake_id_fk" FOREIGN KEY ("sweepstake_id") REFERENCES "public"."sweepstake"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_sweepstake_id_sweepstake_id_fk" FOREIGN KEY ("sweepstake_id") REFERENCES "public"."sweepstake"("id") ON DELETE cascade ON UPDATE no action;