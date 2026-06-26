import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { projectTags, projects } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { uniqueSlug } from "@/lib/slug"
import { recordActivity } from "@/lib/services/activity"
import { setProjectTags, tagsForProjects } from "@/lib/services/tags"
import type {
  ProjectCreateInput,
  ProjectListFilters,
  ProjectUpdateInput,
} from "@/lib/validation/projects"

export type ProjectWithTags = typeof projects.$inferSelect & {
  tags: { id: string; name: string; color: string | null }[]
}

async function attachTags(
  workspaceId: string,
  rows: (typeof projects.$inferSelect)[]
): Promise<ProjectWithTags[]> {
  const byProject = await tagsForProjects(
    workspaceId,
    rows.map((r) => r.id)
  )
  return rows.map((r) => ({ ...r, tags: byProject.get(r.id) ?? [] }))
}

export async function listProjects(
  workspaceId: string,
  filters: ProjectListFilters
): Promise<ProjectWithTags[]> {
  const conditions = [eq(projects.workspaceId, workspaceId)]

  if (!filters.includeArchived) {
    conditions.push(isNull(projects.archivedAt))
  }
  if (filters.status) {
    conditions.push(eq(projects.status, filters.status))
  }
  if (filters.q) {
    const term = `%${filters.q}%`
    conditions.push(
      or(ilike(projects.name, term), ilike(projects.description, term))!
    )
  }
  if (filters.tagId) {
    conditions.push(
      inArray(
        projects.id,
        db
          .select({ id: projectTags.projectId })
          .from(projectTags)
          .where(
            and(
              eq(projectTags.workspaceId, workspaceId),
              eq(projectTags.tagId, filters.tagId)
            )
          )
      )
    )
  }

  const rows = await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.updatedAt))

  return attachTags(workspaceId, rows)
}

export async function getProjectBySlug(
  workspaceId: string,
  slug: string
): Promise<ProjectWithTags | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.slug, slug)))
    .limit(1)
  if (!row) return null
  const [withTags] = await attachTags(workspaceId, [row])
  return withTags
}

export async function getProjectById(
  workspaceId: string,
  projectId: string
): Promise<ProjectWithTags | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId))
    )
    .limit(1)
  if (!row) return null
  const [withTags] = await attachTags(workspaceId, [row])
  return withTags
}

async function takenProjectSlugs(workspaceId: string): Promise<Set<string>> {
  const rows = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
  return new Set(rows.map((r) => r.slug))
}

export async function createProject(
  ctx: AuthContext,
  workspaceId: string,
  input: ProjectCreateInput
): Promise<ProjectWithTags> {
  const slug = uniqueSlug(input.name, await takenProjectSlugs(workspaceId))

  const [row] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: input.name,
      slug,
      description: input.description ?? null,
      status: input.status,
      health: input.health,
      priority: input.priority,
      type: input.type,
      stack: input.stack,
      goal: input.goal ?? null,
      constraints: input.constraints ?? null,
      notes: input.notes ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await setProjectTags(workspaceId, row.id, input.tagIds)

  await recordActivity({
    workspaceId,
    projectId: row.id,
    actorType: "user",
    actorId: ctx.userId,
    type: "project.created",
    title: `Created project "${row.name}"`,
  })

  const [withTags] = await attachTags(workspaceId, [row])
  return withTags
}

export async function updateProject(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: ProjectUpdateInput
): Promise<ProjectWithTags | null> {
  const fields: Partial<typeof projects.$inferInsert> = {}
  if (input.name !== undefined) fields.name = input.name
  if (input.description !== undefined)
    fields.description = input.description ?? null
  if (input.status !== undefined) fields.status = input.status
  if (input.health !== undefined) fields.health = input.health
  if (input.priority !== undefined) fields.priority = input.priority
  if (input.type !== undefined) fields.type = input.type
  if (input.stack !== undefined) fields.stack = input.stack
  if (input.goal !== undefined) fields.goal = input.goal ?? null
  if (input.constraints !== undefined)
    fields.constraints = input.constraints ?? null
  if (input.notes !== undefined) fields.notes = input.notes ?? null

  let row: typeof projects.$inferSelect | undefined
  if (Object.keys(fields).length > 0) {
    ;[row] = await db
      .update(projects)
      .set(fields)
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId))
      )
      .returning()
  } else {
    ;[row] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId))
      )
      .limit(1)
  }

  if (!row) return null

  if (input.tagIds !== undefined) {
    await setProjectTags(workspaceId, projectId, input.tagIds)
  }

  await recordActivity({
    workspaceId,
    projectId: row.id,
    actorType: "user",
    actorId: ctx.userId,
    type: "project.updated",
    title: `Updated project "${row.name}"`,
  })

  const [withTags] = await attachTags(workspaceId, [row])
  return withTags
}

/**
 * Soft delete: set archivedAt + status archived. Never a hard delete (spec §25.3).
 */
export async function archiveProject(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string
): Promise<ProjectWithTags | null> {
  const [row] = await db
    .update(projects)
    .set({ archivedAt: sql`now()`, status: "archived" })
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.id, projectId),
        isNull(projects.archivedAt)
      )
    )
    .returning()

  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.id,
    actorType: "user",
    actorId: ctx.userId,
    type: "project.archived",
    title: `Archived project "${row.name}"`,
  })

  const [withTags] = await attachTags(workspaceId, [row])
  return withTags
}
