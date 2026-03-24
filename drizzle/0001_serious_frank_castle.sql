CREATE TABLE "brand_styles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"accent_color" text DEFAULT '#185FA5' NOT NULL,
	"secondary_color" text DEFAULT '#0F172A' NOT NULL,
	"muted_color" text DEFAULT '#64748B' NOT NULL,
	"logo_url" text,
	"footer_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "brand_style_id" uuid;--> statement-breakpoint
ALTER TABLE "brand_styles" ADD CONSTRAINT "brand_styles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_style_id_brand_styles_id_fk" FOREIGN KEY ("brand_style_id") REFERENCES "public"."brand_styles"("id") ON DELETE set null ON UPDATE no action;