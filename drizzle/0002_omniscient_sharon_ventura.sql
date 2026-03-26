CREATE TABLE "action_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"source_analysis_id" uuid,
	"source_recommendation_index" integer,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_plan_items" ADD CONSTRAINT "action_plan_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan_items" ADD CONSTRAINT "action_plan_items_source_analysis_id_analyses_id_fk" FOREIGN KEY ("source_analysis_id") REFERENCES "public"."analyses"("id") ON DELETE set null ON UPDATE no action;