CREATE TYPE "public"."diff_line_type" AS ENUM('added', 'removed', 'context');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TABLE "analysis_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"severity" "severity" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diff_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"line_type" "diff_line_type" NOT NULL,
	"content" text NOT NULL,
	"line_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"language" varchar(64) DEFAULT 'plaintext' NOT NULL,
	"lines_count" integer NOT NULL,
	"roast_mode" boolean DEFAULT false NOT NULL,
	"score" numeric(4, 2),
	"roast_quote" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_items" ADD CONSTRAINT "analysis_items_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diff_suggestions" ADD CONSTRAINT "diff_suggestions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_score_idx" ON "submissions" USING btree ("score","created_at" DESC NULLS LAST);