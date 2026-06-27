import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { decisions, learnings } from "@/db/schema"
import { searchPatterns, type Pattern } from "@/lib/services/patterns"
import type { Decision } from "@/lib/services/decisions"
import type { Learning } from "@/lib/services/learnings"

export type MemorySearchResult = {
  decisions: Decision[]
  learnings: Learning[]
  patterns: Pattern[]
}

const decisionVector = sql`to_tsvector('english', coalesce(${decisions.title}, '') || ' ' || coalesce(${decisions.body}, ''))`
const learningVector = sql`to_tsvector('english', coalesce(${learnings.title}, '') || ' ' || coalesce(${learnings.body}, ''))`

/**
 * Postgres full-text search across the durable memory objects (decisions,
 * learnings, patterns) for a workspace. Ranking lives here and in patterns.ts so
 * embeddings can replace it later without touching callers (spec §22.4).
 */
export async function searchMemory(
  workspaceId: string,
  query: string,
  opts: { limit?: number } = {}
): Promise<MemorySearchResult> {
  const limit = opts.limit ?? 10
  const q = query.trim()
  if (!q) return { decisions: [], learnings: [], patterns: [] }

  const tsquery = sql`plainto_tsquery('english', ${q})`

  const [decisionRows, learningRows, patternRows] = await Promise.all([
    db
      .select()
      .from(decisions)
      .where(
        and(
          eq(decisions.workspaceId, workspaceId),
          sql`${decisionVector} @@ ${tsquery}`
        )
      )
      .orderBy(sql`ts_rank(${decisionVector}, ${tsquery}) desc`)
      .limit(limit),
    db
      .select()
      .from(learnings)
      .where(
        and(
          eq(learnings.workspaceId, workspaceId),
          sql`${learningVector} @@ ${tsquery}`
        )
      )
      .orderBy(sql`ts_rank(${learningVector}, ${tsquery}) desc`)
      .limit(limit),
    searchPatterns(workspaceId, { query: q, limit }),
  ])

  return {
    decisions: decisionRows,
    learnings: learningRows,
    patterns: patternRows,
  }
}
