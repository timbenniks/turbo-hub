import { and, asc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { projectTags, tags } from "@/db/schema"
import { uniqueSlug } from "@/lib/slug"
import type { TagCreateInput, TagUpdateInput } from "@/lib/validation/tags"

export async function listTags(workspaceId: string) {
  return db
    .select()
    .from(tags)
    .where(eq(tags.workspaceId, workspaceId))
    .orderBy(asc(tags.name))
}

async function takenTagSlugs(workspaceId: string): Promise<Set<string>> {
  const rows = await db
    .select({ slug: tags.slug })
    .from(tags)
    .where(eq(tags.workspaceId, workspaceId))
  return new Set(rows.map((r) => r.slug))
}

export async function createTag(workspaceId: string, input: TagCreateInput) {
  const slug = uniqueSlug(input.name, await takenTagSlugs(workspaceId))
  const [row] = await db
    .insert(tags)
    .values({
      workspaceId,
      name: input.name,
      slug,
      color: input.color ?? null,
    })
    .returning()
  return row
}

export async function updateTag(
  workspaceId: string,
  tagId: string,
  input: TagUpdateInput
) {
  const [row] = await db
    .update(tags)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color ?? null } : {}),
    })
    .where(and(eq(tags.id, tagId), eq(tags.workspaceId, workspaceId)))
    .returning()
  return row ?? null
}

export async function deleteTag(workspaceId: string, tagId: string) {
  const [row] = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.workspaceId, workspaceId)))
    .returning({ id: tags.id })
  return row ?? null
}

/**
 * Replace a project's tag set. Validates the tags belong to the workspace.
 */
export async function setProjectTags(
  workspaceId: string,
  projectId: string,
  tagIds: string[]
) {
  await db
    .delete(projectTags)
    .where(
      and(
        eq(projectTags.workspaceId, workspaceId),
        eq(projectTags.projectId, projectId)
      )
    )

  if (tagIds.length === 0) return

  // Only attach tags that actually belong to this workspace.
  const valid = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.workspaceId, workspaceId), inArray(tags.id, tagIds)))

  if (valid.length === 0) return

  await db.insert(projectTags).values(
    valid.map((t) => ({
      workspaceId,
      projectId,
      tagId: t.id,
    }))
  )
}

/**
 * Tag rows attached to each of the given project ids, keyed by project id.
 */
export async function tagsForProjects(
  workspaceId: string,
  projectIds: string[]
): Promise<Map<string, { id: string; name: string; color: string | null }[]>> {
  const result = new Map<
    string,
    { id: string; name: string; color: string | null }[]
  >()
  if (projectIds.length === 0) return result

  const rows = await db
    .select({
      projectId: projectTags.projectId,
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(projectTags)
    .innerJoin(tags, eq(tags.id, projectTags.tagId))
    .where(
      and(
        eq(projectTags.workspaceId, workspaceId),
        inArray(projectTags.projectId, projectIds)
      )
    )

  for (const row of rows) {
    const list = result.get(row.projectId) ?? []
    list.push({ id: row.id, name: row.name, color: row.color })
    result.set(row.projectId, list)
  }
  return result
}
