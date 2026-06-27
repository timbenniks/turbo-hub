import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { decisions } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { recordActivity } from "@/lib/services/activity"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  DecisionCreateInput,
  DecisionUpdateInput,
} from "@/lib/validation/decisions"

export type Decision = typeof decisions.$inferSelect

export async function listDecisions(
  workspaceId: string,
  projectId: string
): Promise<Decision[]> {
  return db
    .select()
    .from(decisions)
    .where(
      and(
        eq(decisions.workspaceId, workspaceId),
        eq(decisions.projectId, projectId)
      )
    )
    .orderBy(desc(decisions.createdAt))
}

export async function getDecision(
  workspaceId: string,
  decisionId: string
): Promise<Decision | null> {
  const [row] = await db
    .select()
    .from(decisions)
    .where(
      and(eq(decisions.workspaceId, workspaceId), eq(decisions.id, decisionId))
    )
    .limit(1)
  return row ?? null
}

export async function createDecision(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: DecisionCreateInput
): Promise<Decision> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .insert(decisions)
    .values({
      workspaceId,
      projectId,
      title: input.title,
      body: input.body ?? null,
      type: input.type,
      status: input.status,
      taskId: input.taskId ?? null,
      runId: input.runId ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "decision.created",
    title: `Recorded decision "${row.title}"`,
    metadata: { decisionId: row.id },
  })
  return row
}

export async function updateDecision(
  ctx: AuthContext,
  workspaceId: string,
  decisionId: string,
  input: DecisionUpdateInput
): Promise<Decision | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof decisions.$inferInsert> = {}
  if (input.title !== undefined) fields.title = input.title
  if (input.body !== undefined) fields.body = input.body ?? null
  if (input.type !== undefined) fields.type = input.type
  if (input.status !== undefined) fields.status = input.status
  if (input.taskId !== undefined) fields.taskId = input.taskId ?? null
  if (input.runId !== undefined) fields.runId = input.runId ?? null
  if (Object.keys(fields).length === 0) return getDecision(workspaceId, decisionId)

  const [row] = await db
    .update(decisions)
    .set(fields)
    .where(
      and(eq(decisions.workspaceId, workspaceId), eq(decisions.id, decisionId))
    )
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "decision.updated",
    title: `Updated decision "${row.title}"`,
    metadata: { decisionId: row.id },
  })
  return row
}
