import { db } from "@/db"
import { activityEvents } from "@/db/schema"

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
