CREATE INDEX "plans_workspace_project_status_idx" ON "plans" USING btree ("workspace_id","project_id","status");--> statement-breakpoint
CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tasks_workspace_project_status_idx" ON "tasks" USING btree ("workspace_id","project_id","status");--> statement-breakpoint
CREATE INDEX "workspace_members_user_workspace_idx" ON "workspace_members" USING btree ("user_id","workspace_id");