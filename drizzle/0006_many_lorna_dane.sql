CREATE TYPE "public"."agent_profile_type" AS ENUM('cursor_cloud', 'claude_local', 'manual', 'custom_api');--> statement-breakpoint
CREATE TYPE "public"."agent_run_event_type" AS ENUM('run_created', 'agent_started', 'status_update', 'tool_call', 'file_change', 'branch_created', 'pr_opened', 'pr_updated', 'check_passed', 'check_failed', 'human_input_requested', 'error', 'completed', 'learning_added');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('created', 'queued', 'running', 'waiting_for_input', 'waiting_for_review', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."pull_request_state" AS ENUM('open', 'draft', 'merged', 'closed');--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "agent_profile_type" DEFAULT 'manual' NOT NULL,
	"description" text,
	"capabilities" text[] DEFAULT '{}' NOT NULL,
	"default_model" text,
	"configuration" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_run_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"type" "agent_run_event_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"profile_id" text,
	"runner_type" text DEFAULT 'manual' NOT NULL,
	"external_runner_id" text,
	"status" "agent_run_status" DEFAULT 'created' NOT NULL,
	"prompt" text,
	"context_pack_id" text,
	"branch_name" text,
	"pull_request_id" text,
	"summary" text,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"run_id" text,
	"repository_id" text,
	"provider" text DEFAULT 'github' NOT NULL,
	"external_id" text,
	"number" integer,
	"title" text NOT NULL,
	"url" text,
	"state" "pull_request_state" DEFAULT 'open' NOT NULL,
	"author" text,
	"branch" text,
	"base_branch" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"merged_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run_events" ADD CONSTRAINT "agent_run_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run_events" ADD CONSTRAINT "agent_run_events_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_profile_id_agent_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."agent_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_context_pack_id_context_packs_id_fk" FOREIGN KEY ("context_pack_id") REFERENCES "public"."context_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_profiles_workspace_idx" ON "agent_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_run_events_run_idx" ON "agent_run_events" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "agent_runs_project_idx" ON "agent_runs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_runs_task_idx" ON "agent_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "agent_runs_workspace_status_idx" ON "agent_runs" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "pull_requests_project_idx" ON "pull_requests" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pull_requests_task_idx" ON "pull_requests" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "pull_requests_run_idx" ON "pull_requests" USING btree ("run_id");