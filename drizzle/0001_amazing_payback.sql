CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'view' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_plans" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'free' NOT NULL,
	"flowchart_count_week" integer DEFAULT 0 NOT NULL,
	"dummy_count_week" integer DEFAULT 0 NOT NULL,
	"week_start" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "status" text DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "flowchart" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "public_role" text DEFAULT 'view' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;