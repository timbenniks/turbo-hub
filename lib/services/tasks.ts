import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { taskDependencies, tasks } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import type { TaskGen } from "@/lib/ai/schemas"
import { bullets } from "@/lib/markdown"
import { recordActivity } from "@/lib/services/activity"
import type {
  TaskCreateInput,
  TaskDependencyCreateInput,
  TaskListFilters,
  TaskUpdateInput,
} from "@/lib/validation/tasks"

export type Task = typeof tasks.$inferSelect
export type TaskDependency = typeof taskDependencies.$inferSelect

export async function listTasks(
  workspaceId: string,
  projectId: string,
  filters: TaskListFilters = {}
): Promise<Task[]> {
  const conditions = [
    eq(tasks.workspaceId, workspaceId),
    eq(tasks.projectId, projectId),
  ]
  if (filters.status) conditions.push(eq(tasks.status, filters.status))
  if (filters.specId) conditions.push(eq(tasks.specId, filters.specId))

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.createdAt))
}

export async function getTask(
  workspaceId: string,
  taskId: string
): Promise<Task | null> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)))
    .limit(1)
  return row ?? null
}

export async function createTask(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: TaskCreateInput
): Promise<Task> {
  const [row] = await db
    .insert(tasks)
    .values({
      workspaceId,
      projectId,
      specId: input.specId ?? null,
      parentTaskId: input.parentTaskId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      assigneeType: input.assigneeType,
      runnerPreference: input.runnerPreference,
      acceptanceCriteria: input.acceptanceCriteria ?? null,
      contextNotes: input.contextNotes ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "task.created",
    title: `Created task "${row.title}"`,
  })
  return row
}

/** Bulk-insert generated tasks as Backlog drafts (spec §11.4). */
export async function createTasksFromGenerated(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  specId: string,
  genTasks: TaskGen["tasks"]
): Promise<Task[]> {
  if (genTasks.length === 0) return []
  return db
    .insert(tasks)
    .values(
      genTasks.map((t) => ({
        workspaceId,
        projectId,
        specId,
        title: t.title,
        description: t.description,
        status: "backlog" as const,
        priority: t.priority,
        runnerPreference: t.runnerPreference,
        acceptanceCriteria: bullets(t.acceptanceCriteria),
        createdBy: ctx.userId,
      }))
    )
    .returning()
}

export async function updateTask(
  ctx: AuthContext,
  workspaceId: string,
  taskId: string,
  input: TaskUpdateInput
): Promise<Task | null> {
  const fields: Partial<typeof tasks.$inferInsert> = {}
  if (input.title !== undefined) fields.title = input.title
  if (input.description !== undefined)
    fields.description = input.description ?? null
  if (input.priority !== undefined) fields.priority = input.priority
  if (input.assigneeType !== undefined) fields.assigneeType = input.assigneeType
  if (input.runnerPreference !== undefined)
    fields.runnerPreference = input.runnerPreference
  if (input.acceptanceCriteria !== undefined)
    fields.acceptanceCriteria = input.acceptanceCriteria ?? null
  if (input.contextNotes !== undefined)
    fields.contextNotes = input.contextNotes ?? null
  if (input.specId !== undefined) fields.specId = input.specId ?? null
  if (input.parentTaskId !== undefined)
    fields.parentTaskId = input.parentTaskId ?? null
  if (input.status !== undefined) {
    fields.status = input.status
    fields.completedAt = input.status === "done" ? new Date() : null
  }
  if (Object.keys(fields).length === 0) return getTask(workspaceId, taskId)

  const [row] = await db
    .update(tasks)
    .set(fields)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)))
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "task.updated",
    title: `Updated task "${row.title}"`,
  })
  return row
}

export async function listDependencies(
  workspaceId: string,
  taskId: string
): Promise<TaskDependency[]> {
  return db
    .select()
    .from(taskDependencies)
    .where(
      and(
        eq(taskDependencies.workspaceId, workspaceId),
        eq(taskDependencies.taskId, taskId)
      )
    )
}

export async function addDependency(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  taskId: string,
  input: TaskDependencyCreateInput
): Promise<TaskDependency | null> {
  if (input.dependsOnTaskId === taskId) return null
  const [row] = await db
    .insert(taskDependencies)
    .values({
      workspaceId,
      projectId,
      taskId,
      dependsOnTaskId: input.dependsOnTaskId,
      type: input.type,
    })
    .onConflictDoNothing()
    .returning()
  return row ?? null
}
