ALTER TABLE "activity_events" ADD COLUMN "task_id" text;--> statement-breakpoint
UPDATE "activity_events" SET "task_id" = "metadata"->>'taskId' WHERE "task_id" IS NULL AND "metadata" ? 'taskId';--> statement-breakpoint
CREATE INDEX "activity_events_task_idx" ON "activity_events" USING btree ("task_id");