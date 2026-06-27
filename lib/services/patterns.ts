import { and, arrayOverlaps, desc, eq, isNull, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { patterns } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { recordActivity } from "@/lib/services/activity"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  PatternCreateInput,
  PatternSearchInput,
  PatternUpdateInput,
} from "@/lib/validation/patterns"

export type Pattern = typeof patterns.$inferSelect

/** Full-text vector over the human-readable pattern fields. */
const ftsVector = sql`to_tsvector('english', coalesce(${patterns.summary}, '') || ' ' || coalesce(${patterns.body}, '') || ' ' || coalesce(${patterns.appliesTo}, ''))`

const EDITABLE_FIELDS = [
  "summary",
  "body",
  "appliesTo",
  "type",
  "tags",
  "stack",
] as const

export async function listPatterns(
  workspaceId: string,
  opts: { includeArchived?: boolean } = {}
): Promise<Pattern[]> {
  const conditions = [eq(patterns.workspaceId, workspaceId)]
  if (!opts.includeArchived) conditions.push(isNull(patterns.archivedAt))
  return db
    .select()
    .from(patterns)
    .where(and(...conditions))
    .orderBy(desc(patterns.usageCount), desc(patterns.updatedAt))
}

export async function getPattern(
  workspaceId: string,
  patternId: string
): Promise<Pattern | null> {
  const [row] = await db
    .select()
    .from(patterns)
    .where(
      and(eq(patterns.workspaceId, workspaceId), eq(patterns.id, patternId))
    )
    .limit(1)
  return row ?? null
}

export async function createPattern(
  ctx: AuthContext,
  workspaceId: string,
  input: PatternCreateInput
): Promise<Pattern> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .insert(patterns)
    .values({
      workspaceId,
      summary: input.summary,
      body: input.body ?? null,
      appliesTo: input.appliesTo ?? null,
      type: input.type ?? null,
      tags: input.tags ?? [],
      stack: input.stack ?? [],
      sourceProjectId: input.sourceProjectId ?? null,
      sourceTaskId: input.sourceTaskId ?? null,
      sourceLearningId: input.sourceLearningId ?? null,
      sourceRunId: input.sourceRunId ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  await recordActivity({
    workspaceId,
    projectId: input.sourceProjectId ?? null,
    actorId: ctx.userId,
    type: "pattern.created",
    title: `Created pattern "${row.summary}"`,
    metadata: { patternId: row.id },
  })
  return row
}

export async function updatePattern(
  ctx: AuthContext,
  workspaceId: string,
  patternId: string,
  input: PatternUpdateInput
): Promise<Pattern | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof patterns.$inferInsert> = {}
  for (const key of EDITABLE_FIELDS) {
    if (input[key] === undefined) continue
    if (key === "summary") fields.summary = input.summary
    else if (key === "tags") fields.tags = input.tags ?? []
    else if (key === "stack") fields.stack = input.stack ?? []
    else fields[key] = input[key] ?? null
  }
  if (Object.keys(fields).length === 0) return getPattern(workspaceId, patternId)

  const [row] = await db
    .update(patterns)
    .set(fields)
    .where(
      and(eq(patterns.workspaceId, workspaceId), eq(patterns.id, patternId))
    )
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.sourceProjectId,
    actorId: ctx.userId,
    type: "pattern.updated",
    title: `Updated pattern "${row.summary}"`,
    metadata: { patternId: row.id },
  })
  return row
}

export async function archivePattern(
  ctx: AuthContext,
  workspaceId: string,
  patternId: string
): Promise<Pattern | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .update(patterns)
    .set({ archivedAt: new Date() })
    .where(
      and(eq(patterns.workspaceId, workspaceId), eq(patterns.id, patternId))
    )
    .returning()
  if (!row) return null

  await recordActivity({
    workspaceId,
    projectId: row.sourceProjectId,
    actorId: ctx.userId,
    type: "pattern.archived",
    title: `Archived pattern "${row.summary}"`,
    metadata: { patternId: row.id },
  })
  return row
}

/**
 * Search patterns by Postgres full-text query plus optional tag/stack/type
 * filters (spec §11.10, §22.4). Ranking is isolated here so embeddings can slot
 * in later. Excludes archived patterns.
 */
export async function searchPatterns(
  workspaceId: string,
  input: PatternSearchInput
): Promise<Pattern[]> {
  const conditions = [
    eq(patterns.workspaceId, workspaceId),
    isNull(patterns.archivedAt),
  ]
  if (input.tags?.length)
    conditions.push(arrayOverlaps(patterns.tags, input.tags))
  if (input.stack?.length)
    conditions.push(arrayOverlaps(patterns.stack, input.stack))
  if (input.type) conditions.push(eq(patterns.type, input.type))
  if (input.sourceProjectId)
    conditions.push(eq(patterns.sourceProjectId, input.sourceProjectId))

  const query = input.query?.trim()
  if (query) {
    const tsquery = sql`plainto_tsquery('english', ${query})`
    conditions.push(sql`${ftsVector} @@ ${tsquery}`)
    return db
      .select()
      .from(patterns)
      .where(and(...conditions))
      .orderBy(sql`ts_rank(${ftsVector}, ${tsquery}) desc`, desc(patterns.usageCount))
      .limit(input.limit)
  }

  return db
    .select()
    .from(patterns)
    .where(and(...conditions))
    .orderBy(desc(patterns.usageCount), desc(patterns.updatedAt))
    .limit(input.limit)
}

/**
 * Surface patterns relevant to a task/project by tag/stack/type overlap — used
 * to inject reusable patterns into an assembled context pack (spec §13.7).
 */
export async function findRelevantPatterns(
  workspaceId: string,
  opts: { tags?: string[]; stack?: string[]; type?: string; limit?: number }
): Promise<Pattern[]> {
  const overlap = [
    opts.tags?.length ? arrayOverlaps(patterns.tags, opts.tags) : null,
    opts.stack?.length ? arrayOverlaps(patterns.stack, opts.stack) : null,
    opts.type ? eq(patterns.type, opts.type) : null,
  ].filter((c): c is NonNullable<typeof c> => c != null)

  const conditions = [
    eq(patterns.workspaceId, workspaceId),
    isNull(patterns.archivedAt),
  ]
  if (overlap.length) {
    const match = or(...overlap)
    if (match) conditions.push(match)
  }

  return db
    .select()
    .from(patterns)
    .where(and(...conditions))
    .orderBy(desc(patterns.usageCount), desc(patterns.lastUsedAt))
    .limit(opts.limit ?? 5)
}

/** Bump usage_count / last_used_at when a pattern gets applied (spec §11.10). */
export async function recordPatternUsage(
  ctx: AuthContext,
  workspaceId: string,
  patternId: string
): Promise<Pattern | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .update(patterns)
    .set({
      usageCount: sql`${patterns.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(
      and(eq(patterns.workspaceId, workspaceId), eq(patterns.id, patternId))
    )
    .returning()
  return row ?? null
}
