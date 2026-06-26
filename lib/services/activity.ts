import { db } from "@/db"
import { activityEvents } from "@/db/schema"
import { and, desc, eq, sql } from "drizzle-orm"

type ActorType = "user" | "agent" | "system"

export type RecordActivityInput = {
  workspaceId: string
  projectId?: string | null
  actorType?: ActorType
  actorId?: string | null
  type: string
  title: string
  body?: string | null
  metadata?: unknown
}

/**
 * Append a workspace/project activity event. Called by every mutating service
 * so the activity feed and audit trail stay complete (spec §27).
 */
export async function recordActivity(input: RecordActivityInput) {
  await db.insert(activityEvents).values({
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? null,
    actorType: input.actorType ?? "user",
    actorId: input.actorId ?? null,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
  })
}

export type ActivityEvent = typeof activityEvents.$inferSelect

export async function listProjectActivity(
  workspaceId: string,
  projectId: string,
  limit = 20
): Promise<ActivityEvent[]> {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.workspaceId, workspaceId),
        eq(activityEvents.projectId, projectId)
      )
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit)
}

export async function listTaskActivity(
  workspaceId: string,
  projectId: string,
  taskId: string,
  limit = 20
): Promise<ActivityEvent[]> {
  return db
    .select()
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.workspaceId, workspaceId),
        eq(activityEvents.projectId, projectId),
        sql`${activityEvents.metadata}->>'taskId' = ${taskId}`
      )
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit)
}
