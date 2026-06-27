CREATE TYPE "public"."context_pack_status" AS ENUM('draft', 'approved', 'sent', 'archived');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('proposed', 'accepted', 'rejected', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."decision_type" AS ENUM('architecture', 'tooling', 'process', 'product', 'naming', 'tradeoff', 'other');--> statement-breakpoint
CREATE TYPE "public"."learning_type" AS ENUM('success', 'failure', 'gotcha', 'reusable_idea', 'convention', 'anti_pattern');--> statement-breakpoint
CREATE TABLE "context_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"sources" jsonb,
	"token_estimate" integer DEFAULT 0 NOT NULL,
	"status" "context_pack_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"run_id" text,
	"title" text NOT NULL,
	"body" text,
	"type" "decision_type" DEFAULT 'other' NOT NULL,
	"status" "decision_status" DEFAULT 'proposed' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learnings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"run_id" text,
	"title" text NOT NULL,
	"body" text,
	"type" "learning_type" DEFAULT 'gotcha' NOT NULL,
	"confidence" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"stack" text[] DEFAULT '{}' NOT NULL,
	"promoted_to_pattern" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"summary" text NOT NULL,
	"body" text,
	"applies_to" text,
	"type" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"stack" text[] DEFAULT '{}' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"source_project_id" text,
	"source_task_id" text,
	"source_learning_id" text,
	"source_run_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_packs" ADD CONSTRAINT "context_packs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_source_project_id_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_source_task_id_tasks_id_fk" FOREIGN KEY ("source_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "context_packs_task_idx" ON "context_packs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "context_packs_project_idx" ON "context_packs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "decisions_project_idx" ON "decisions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "decisions_workspace_status_idx" ON "decisions" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "decisions_fts_idx" ON "decisions" USING gin (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("body", '')));--> statement-breakpoint
CREATE INDEX "learnings_project_idx" ON "learnings" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "learnings_workspace_type_idx" ON "learnings" USING btree ("workspace_id","type");--> statement-breakpoint
CREATE INDEX "learnings_tags_idx" ON "learnings" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "learnings_fts_idx" ON "learnings" USING gin (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("body", '')));--> statement-breakpoint
CREATE INDEX "patterns_workspace_idx" ON "patterns" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "patterns_tags_idx" ON "patterns" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "patterns_stack_idx" ON "patterns" USING gin ("stack");--> statement-breakpoint
CREATE INDEX "patterns_fts_idx" ON "patterns" USING gin (to_tsvector('english', coalesce("summary", '') || ' ' || coalesce("body", '') || ' ' || coalesce("applies_to", '')));