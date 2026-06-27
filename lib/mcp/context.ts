import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js"

import { AuthError } from "@/lib/auth/context"
import type { AuthContext } from "@/lib/auth/context"
import { apiKeyForToken } from "@/lib/services/api-keys"
import type { ApiKeyScope } from "@/lib/enums"
import {
  getProjectById,
  getProjectBySlug,
  listProjects,
} from "@/lib/services/projects"
import { getUserProfile } from "@/lib/services/users"
import { getPrimaryWorkspaceId } from "@/lib/services/workspaces"

/** Auth context we stash on AuthInfo.extra and reconstruct inside tools. */
export type McpAuthExtra = {
  userId: string
  name: string | null | undefined
  email: string | null | undefined
  image: string | null | undefined
  workspaceId: string
  scopes: ApiKeyScope[]
  /** Token id (for audit) + allowlists (null = unrestricted). */
  tokenId: string
  allowedProjectIds: string[] | null
  allowedToolNames: string[] | null
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

  const key = await apiKeyForToken(bearer)
  if (!key) return undefined

  const workspaceId = await getPrimaryWorkspaceId(key.userId)
  if (!workspaceId) return undefined

  const user = await getUserProfile(key.userId)

  const extra: McpAuthExtra = {
    userId: key.userId,
    name: user?.name,
    email: user?.email,
    image: user?.image,
    workspaceId,
    scopes: key.scopes,
    tokenId: key.id,
    allowedProjectIds: key.allowedProjectIds,
    allowedToolNames: key.allowedToolNames,
  }
  return { token: bearer, clientId: key.userId, scopes: key.scopes, extra }
}

/** Read the full MCP auth extra (token id, allowlists, scopes) for the guard. */
export function mcpAuth(extra: { authInfo?: AuthInfo }): McpAuthExtra | null {
  return (extra.authInfo?.extra as McpAuthExtra | undefined) ?? null
}

export type ToolAuth = { ctx: AuthContext; workspaceId: string }

/** Reconstruct the AuthContext + workspaceId from the tool handler's `extra`. */
export function requireAuth(extra: { authInfo?: AuthInfo }): ToolAuth {
  const a = extra.authInfo?.extra as McpAuthExtra | undefined
  if (!a) throw new Error("Not authenticated.")
  return {
    ctx: {
      userId: a.userId,
      name: a.name,
      email: a.email,
      image: a.image,
      apiKeyScopes: a.scopes,
    },
    workspaceId: a.workspaceId,
  }
}

export function requireWriteAuth(extra: { authInfo?: AuthInfo }): ToolAuth {
  const a = extra.authInfo?.extra as McpAuthExtra | undefined
  if (!a?.scopes.includes("mcp:write")) {
    throw new AuthError("API key is missing mcp:write scope", 403)
  }
  return requireAuth(extra)
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
