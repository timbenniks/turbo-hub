import { eq } from "drizzle-orm"
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js"

import { db } from "@/db"
import { users } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { userIdForToken } from "@/lib/services/api-keys"
import {
  getProjectById,
  getProjectBySlug,
  listProjects,
} from "@/lib/services/projects"
import { getPrimaryWorkspaceId } from "@/lib/services/workspaces"

/** Auth context we stash on AuthInfo.extra and reconstruct inside tools. */
type McpAuthExtra = {
  userId: string
  name: string | null | undefined
  email: string | null | undefined
  image: string | null | undefined
  workspaceId: string
}

/**
 * Verify a bearer token (the `thub_` personal access token) for `withMcpAuth`.
 * Resolves the token → user → primary workspace and stashes the context on
 * `AuthInfo.extra`. Returns undefined for missing/invalid tokens (→ 401).
 */
export async function verifyToken(
  _req: Request,
  bearer?: string
): Promise<AuthInfo | undefined> {
  if (!bearer) return undefined

  const userId = await userIdForToken(bearer)
  if (!userId) return undefined

  const workspaceId = await getPrimaryWorkspaceId(userId)
  if (!workspaceId) return undefined

  const [user] = await db
    .select({ name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const extra: McpAuthExtra = {
    userId,
    name: user?.name,
    email: user?.email,
    image: user?.image,
    workspaceId,
  }
  return { token: bearer, clientId: userId, scopes: [], extra }
}

export type ToolAuth = { ctx: AuthContext; workspaceId: string }

/** Reconstruct the AuthContext + workspaceId from the tool handler's `extra`. */
export function requireAuth(extra: { authInfo?: AuthInfo }): ToolAuth {
  const a = extra.authInfo?.extra as McpAuthExtra | undefined
  if (!a) throw new Error("Not authenticated.")
  return {
    ctx: { userId: a.userId, name: a.name, email: a.email, image: a.image },
    workspaceId: a.workspaceId,
  }
}

/**
 * Resolve a user-supplied project reference (id, slug, or exact name) to its
 * ULID, scoped to the workspace. Throws on no match / ambiguous name.
 */
export async function resolveProject(
  workspaceId: string,
  ref: string
): Promise<string> {
  const byId = await getProjectById(workspaceId, ref)
  if (byId) return byId.id

  const bySlug = await getProjectBySlug(workspaceId, ref)
  if (bySlug) return bySlug.id

  const all = await listProjects(workspaceId, { includeArchived: true })
  const lc = ref.toLowerCase()
  const matches = all.filter((p) => p.name.toLowerCase() === lc)
  if (matches.length === 1) return matches[0].id
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous project "${ref}" — ${matches.length} share that name. Use the id or slug.`
    )
  }
  throw new Error(`No project matching "${ref}" (tried id, slug, and name).`)
}
