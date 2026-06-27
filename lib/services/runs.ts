import { and, count, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { agentRunEvents, agentRuns, projects, tasks } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { cacheTags, cachedRead, invalidateTags } from "@/lib/cache"
import type { AgentRunStatus } from "@/lib/enums"
import { getRunner } from "@/lib/runners/registry"
import { recordActivity } from "@/lib/services/activity"
import { updateTask } from "@/lib/services/tasks"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  RunCompleteInput,
  RunCreateInput,
  RunEventCreateInput,
  RunFailInput,
  RunUpdateInput,
} from "@/lib/validation/runs"

export type AgentRun = typeof agentRuns.$inferSelect
export type AgentRunEvent = typeof agentRunEvents.$inferSelect

const ACTIVE_STATUSES: AgentRunStatus[] = [
  "created",
  "queued",
  "running",
  "waiting_for_input",
  "waiting_for_review",
]

/** Drop the cached active-run count after any run status change. */
function revalidateRunCounts(workspaceId: string) {
  invalidateTags(cacheTags.workspaceRuns(workspaceId))
}

/** Cached count of active (non-terminal) runs — drives the dashboard card. */
export async function countActiveRuns(workspaceId: string): Promise<number> {
  return cachedRead(
    async () => {
      const [row] = await db
        .select({ value: count() })
        .from(agentRuns)
        .where(
          and(
            eq(agentRuns.workspaceId, workspaceId),
            inArray(agentRuns.status, ACTIVE_STATUSES)
          )
        )
      return row?.value ?? 0
    },
    ["countActiveRuns", workspaceId],
    [cacheTags.workspaceRuns(workspaceId)]
  )
}

export async function listProjectRuns(
  workspaceId: string,
  projectId: string
): Promise<AgentRun[]> {
  return db
    .select()
    .from(agentRuns)
    .where(
      and(
        eq(agentRuns.workspaceId, workspaceId),
        eq(agentRuns.projectId, projectId)
      )
    )
    .orderBy(desc(agentRuns.createdAt))
}

export async function listTaskRuns(
  workspaceId: string,
  taskId: string
): Promise<AgentRun[]> {
  return db
    .select()
    .from(agentRuns)
    .where(
      and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.taskId, taskId))
    )
    .orderBy(desc(agentRuns.createdAt))
}

export type WorkspaceRunListItem = AgentRun & {
  projectName: string | null
  taskTitle: string | null
}

/** Workspace runs joined with their project name (for the cross-project list). */
export async function listWorkspaceRunsWithProject(
  workspaceId: string,
  opts: { limit?: number } = {}
): Promise<WorkspaceRunListItem[]> {
  const rows = await db
    .select({
      run: agentRuns,
      projectName: projects.name,
      taskTitle: tasks.title,
    })
    .from(agentRuns)
    .innerJoin(projects, eq(agentRuns.projectId, projects.id))
    .leftJoin(tasks, eq(agentRuns.taskId, tasks.id))
    .where(eq(agentRuns.workspaceId, workspaceId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(opts.limit ?? 50)
  return rows.map((r) => ({
    ...r.run,
    projectName: r.projectName,
    taskTitle: r.taskTitle,
  }))
}

export async function getRun(
  workspaceId: string,
  runId: string
): Promise<AgentRun | null> {
  const [row] = await db
    .select()
    .from(agentRuns)
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .limit(1)
  return row ?? null
}

export async function listRunEvents(
  workspaceId: string,
  runId: string
): Promise<AgentRunEvent[]> {
  return db
    .select()
    .from(agentRunEvents)
    .where(
      and(
        eq(agentRunEvents.workspaceId, workspaceId),
        eq(agentRunEvents.runId, runId)
      )
    )
    .orderBy(agentRunEvents.createdAt)
}

/**
 * Insert an append-only run timeline event and mirror it to the activity feed.
 * Exported (no `ctx`) so `pullRequests` can log run events without a circular
 * import. `taskId` lets the event also surface on the task timeline.
 */
export async function recordRunEvent(params: {
  workspaceId: string
  projectId: string
  runId: string
  event: RunEventCreateInput
  taskId?: string | null
  actorId?: string | null
  activityType?: string
}): Promise<AgentRunEvent> {
  const { workspaceId, projectId, runId, event, taskId, actorId } = params
  const [row] = await db
    .insert(agentRunEvents)
    .values({
      workspaceId,
      runId,
      type: event.type,
      title: event.title,
      body: event.body ?? null,
      metadata: event.metadata ?? null,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId,
    taskId: taskId ?? null,
    actorType: "agent",
    actorId: actorId ?? null,
    type: params.activityType ?? "run.event",
    title: event.title,
    metadata: { runId, eventType: event.type },
  })
  return row
}

export async function createRun(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: RunCreateInput
): Promise<AgentRun> {
  await assertWorkspaceMember(ctx, workspaceId)
  const runner = getRunner(input.runnerType)
  const result = await runner.createRun({
    prompt: input.prompt,
    branchName: input.branchName,
  })

  const [run] = await db
    .insert(agentRuns)
    .values({
      workspaceId,
      projectId,
      taskId: input.taskId ?? null,
      profileId: input.profileId ?? null,
      runnerType: input.runnerType,
      externalRunnerId: result.externalId ?? null,
      status: result.status ?? "created",
      prompt: input.prompt ?? null,
      contextPackId: input.contextPackId ?? null,
      branchName: input.branchName ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordRunEvent({
    workspaceId,
    projectId,
    taskId: run.taskId,
    actorId: ctx.userId,
    runId: run.id,
    event: { type: "run_created", title: `Run created (${input.runnerType})` },
    activityType: "run.created",
  })
  revalidateRunCounts(workspaceId)
  return run
}

export async function startRun(
  ctx: AuthContext,
  workspaceId: string,
  runId: string
): Promise<AgentRun | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [run] = await db
    .update(agentRuns)
    .set({ status: "running", startedAt: new Date() })
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .returning()
  if (!run) return null

  await recordRunEvent({
    workspaceId,
    projectId: run.projectId,
    taskId: run.taskId,
    actorId: ctx.userId,
    runId: run.id,
    event: { type: "agent_started", title: "Agent started" },
  })
  if (run.taskId)
    await updateTask(ctx, workspaceId, run.taskId, { status: "running" })
  revalidateRunCounts(workspaceId)
  return run
}

export async function updateRun(
  ctx: AuthContext,
  workspaceId: string,
  runId: string,
  input: RunUpdateInput
): Promise<AgentRun | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof agentRuns.$inferInsert> = {}
  if (input.status !== undefined) fields.status = input.status
  if (input.summary !== undefined) fields.summary = input.summary ?? null
  if (input.error !== undefined) fields.error = input.error ?? null
  if (input.branchName !== undefined)
    fields.branchName = input.branchName ?? null
  if (Object.keys(fields).length === 0) return getRun(workspaceId, runId)

  const [run] = await db
    .update(agentRuns)
    .set(fields)
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .returning()
  if (!run) return null

  if (input.status !== undefined)
    await recordRunEvent({
      workspaceId,
      projectId: run.projectId,
      taskId: run.taskId,
      actorId: ctx.userId,
      runId: run.id,
      event: { type: "status_update", title: `Status → ${input.status}` },
    })
  if (input.status !== undefined) revalidateRunCounts(workspaceId)
  return run
}

export async function appendRunEvent(
  ctx: AuthContext,
  workspaceId: string,
  runId: string,
  input: RunEventCreateInput
): Promise<AgentRunEvent | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const run = await getRun(workspaceId, runId)
  if (!run) return null
  return recordRunEvent({
    workspaceId,
    projectId: run.projectId,
    taskId: run.taskId,
    actorId: ctx.userId,
    runId,
    event: input,
  })
}

export async function completeRun(
  ctx: AuthContext,
  workspaceId: string,
  runId: string,
  input: RunCompleteInput
): Promise<AgentRun | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [run] = await db
    .update(agentRuns)
    .set({
      status: "completed",
      completedAt: new Date(),
      summary: input.summary ?? null,
    })
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .returning()
  if (!run) return null

  await recordRunEvent({
    workspaceId,
    projectId: run.projectId,
    taskId: run.taskId,
    actorId: ctx.userId,
    runId: run.id,
    event: { type: "completed", title: "Run completed", body: input.summary },
    activityType: "run.completed",
  })
  // A completed run leaves the task awaiting human review (spec §28.6).
  if (run.taskId)
    await updateTask(ctx, workspaceId, run.taskId, { status: "in_review" })
  revalidateRunCounts(workspaceId)
  return run
}

export async function failRun(
  ctx: AuthContext,
  workspaceId: string,
  runId: string,
  input: RunFailInput
): Promise<AgentRun | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [run] = await db
    .update(agentRuns)
    .set({
      status: "failed",
      completedAt: new Date(),
      error: input.error ?? null,
    })
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .returning()
  if (!run) return null

  await recordRunEvent({
    workspaceId,
    projectId: run.projectId,
    taskId: run.taskId,
    actorId: ctx.userId,
    runId: run.id,
    event: { type: "error", title: "Run failed", body: input.error },
    activityType: "run.failed",
  })
  if (run.taskId)
    await updateTask(ctx, workspaceId, run.taskId, { status: "needs_changes" })
  revalidateRunCounts(workspaceId)
  return run
}

export async function cancelRun(
  ctx: AuthContext,
  workspaceId: string,
  runId: string
): Promise<AgentRun | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const run = await getRun(workspaceId, runId)
  if (!run) return null
  const runner = getRunner(run.runnerType)
  if (run.externalRunnerId) await runner.cancelRun(run.externalRunnerId)

  const [updated] = await db
    .update(agentRuns)
    .set({ status: "canceled", completedAt: new Date() })
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .returning()

  await recordRunEvent({
    workspaceId,
    projectId: run.projectId,
    taskId: run.taskId,
    actorId: ctx.userId,
    runId: run.id,
    event: { type: "status_update", title: "Run canceled" },
  })
  revalidateRunCounts(workspaceId)
  return updated ?? null
}
