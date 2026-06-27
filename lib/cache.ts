import { revalidateTag, unstable_cache } from "next/cache"

const ONE_HOUR = 3600

/**
 * Force immediate (not stale-while-revalidate) expiry. Next 16's
 * `revalidateTag(tag, "max")` is soft — the next read can still serve a stale
 * value once. `{ expire: 0 }` drops the entry now, giving read-your-writes after
 * a mutation. Usable from route handlers (unlike the Server-Action-only
 * `updateTag`).
 */
const IMMEDIATE = { expire: 0 } as const

/** Invalidate one or more cache tags immediately. Call from mutation paths. */
export function invalidateTags(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag, IMMEDIATE)
}

/**
 * Cache tags for workspace-scoped reads. `revalidateTag(tag)` from a mutation
 * drops the matching cache entries so the next read re-queries the DB.
 */
export const cacheTags = {
  /** Project list views (dashboard "recent" + /projects). */
  projectsList: (workspaceId: string) => `projects-list:${workspaceId}`,
  /** A single project resolved by slug (project layout + every tab). */
  projectBySlug: (slug: string) => `project-slug:${slug}`,
  /** A project's derived data: active plan + task counts. */
  project: (workspaceId: string, projectId: string) =>
    `project:${workspaceId}:${projectId}`,
  /** Workspace-wide task aggregates (dashboard blocked count). */
  workspaceTasks: (workspaceId: string) => `workspace-tasks:${workspaceId}`,
  /** Workspace-wide run aggregates (dashboard active-runs count). */
  workspaceRuns: (workspaceId: string) => `workspace-runs:${workspaceId}`,
}

/**
 * Wrap a side-effect-free, workspace-scoped read in the Next.js Data Cache so
 * repeat requests skip the DB round-trip. `keyParts` must FULLY identify the
 * result (include every argument the query depends on); `tags` drive
 * invalidation via revalidateTag() on writes.
 *
 * Only cache reads whose results are serialization-safe — anything that calls
 * Date methods downstream (e.g. the task list) must stay uncached, since the
 * Data Cache round-trips values through serialization.
 */
export function cachedRead<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  tags: string[],
  revalidate: number = ONE_HOUR
): Promise<T> {
  return unstable_cache(fn, keyParts, { tags, revalidate })()
}
