ALTER TABLE "api_keys" ADD COLUMN "allowed_project_ids" jsonb;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "allowed_tool_names" jsonb;