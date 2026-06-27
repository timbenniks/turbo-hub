import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { learnings } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { recordActivity } from "@/lib/services/activity"
import { createPattern, getPattern, type Pattern } from "@/lib/services/patterns"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  LearningCreateInput,
  LearningUpdateInput,
} from "@/lib/validation/learnings"

export type Learning = typeof learnings.$inferSelect

export async function listLearnings(
  workspaceId: string,
  projectId: string
): Promise<Learning[]> {
  return db
    .select()
    .from(learnings)
    .where(
      and(
        eq(learnings.workspaceId, workspaceId),
        eq(learnings.projectId, projectId)
      )
    )
    .orderBy(desc(learnings.createdAt))
}

export async function getLearning(
  workspaceId: string,
  learningId: string
): Promise<Learning | null> {
  const [row] = await db
    .select()
    .from(learnings)
    .where(
      and(eq(learnings.workspaceId, workspaceId), eq(learnings.id, learningId))
    )
    .limit(1)
  return row ?? null
}

export async function createLearning(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: LearningCreateInput
): Promise<Learning> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .insert(learnings)
    .values({
      workspaceId,
      projectId,
      title: input.title,
      body: input.body ?? null,
      type: input.type,
      confidence: input.confidence ?? null,
      tags: input.tags ?? [],
      stack: input.stack ?? [],
      taskId: input.taskId ?? null,
      runId: input.runId ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "learning.created",
    title: `Captured learning "${row.title}"`,
    metadata: { learningId: row.id },
  })
  return row
}

export async function updateLearning(
  ctx: AuthContext,
  workspaceId: string,
  learningId: string,
  input: LearningUpdateInput
): Promise<Learning | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof learnings.$inferInsert> = {}
  if (input.title !== undefined) fields.title = input.title
  if (input.body !== undefined) fields.body = input.body ?? null
  if (input.type !== undefined) fields.type = input.type
  if (input.confidence !== undefined) fields.confidence = input.confidence ?? null
  if (input.tags !== undefined) fields.tags = input.tags ?? []
  if (input.stack !== undefined) fields.stack = input.stack ?? []
  if (input.taskId !== undefined) fields.taskId = input.taskId ?? null
  if (input.runId !== undefined) fields.runId = input.runId ?? null
  if (Object.keys(fields).length === 0) return getLearning(workspaceId, learningId)

  const [row] = await db
    .update(learnings)
    .set(fields)
    .where(
      and(eq(learnings.workspaceId, workspaceId), eq(learnings.id, learningId))
    )
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "learning.updated",
    title: `Updated learning "${row.title}"`,
    metadata: { learningId: row.id },
  })
  return row
}

/**
 * Promote a learning into a reusable pattern (spec §11.10, §26.4 — human- or
 * agent-confirmed). Idempotent: a learning already promoted returns its pattern.
 */
export async function promoteToPattern(
  ctx: AuthContext,
  workspaceId: string,
  learningId: string
): Promise<Pattern | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const learning = await getLearning(workspaceId, learningId)
  if (!learning) return null
  if (learning.promotedToPattern) {
    return getPattern(workspaceId, learning.promotedToPattern)
  }

  const pattern = await createPattern(ctx, workspaceId, {
    summary: learning.title,
    body: learning.body ?? undefined,
    type: learning.type,
    tags: learning.tags,
    stack: learning.stack,
    sourceProjectId: learning.projectId,
    sourceTaskId: learning.taskId ?? undefined,
    sourceLearningId: learning.id,
    sourceRunId: learning.runId ?? undefined,
  })

  await db
    .update(learnings)
    .set({ promotedToPattern: pattern.id })
    .where(
      and(eq(learnings.workspaceId, workspaceId), eq(learnings.id, learningId))
    )

  await recordActivity({
    workspaceId,
    projectId: learning.projectId,
    actorId: ctx.userId,
    type: "learning.promoted",
    title: `Promoted learning "${learning.title}" to a pattern`,
    metadata: { learningId: learning.id, patternId: pattern.id },
  })
  return pattern
}
