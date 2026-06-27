import { cache } from "react"

import { auth } from "@/auth"
import { userFromApiKey } from "@/lib/auth/api-key"
import {
  bootstrapWorkspace,
  getMembership,
  getPrimaryWorkspaceId,
} from "@/lib/services/workspaces"
import { timeAsync } from "@/lib/timing"

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = "AuthError"
  }
}

export type AuthContext = {
  userId: string
  name?: string | null
  email?: string | null
  image?: string | null
  apiKeyScopes?: readonly string[]
}

/**
 * Resolve the current user or throw 401. Use in services, API routes, and
 * server components that require authentication.
 */
const getSession = cache(async () => timeAsync("auth.session", () => auth()))
export const getCachedPrimaryWorkspaceId = cache((userId: string) =>
  timeAsync("workspace.primary", () => getPrimaryWorkspaceId(userId))
)

/**
 * Resolve the current user from a browser session OR a personal access token.
 * Token auth (external agents, CLIs, MCP) is checked first so a `Bearer` header
 * takes precedence over any cookie. Use this for normal API/app authentication.
 */
export const requireUser = cache(async (): Promise<AuthContext> => {
  const tokenUser = await userFromApiKey()
  if (tokenUser) return tokenUser

  const session = await getSession()
  if (!session?.user?.id) {
    throw new AuthError("Not authenticated", 401)
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
})

/**
 * Resolve the current user from a browser session ONLY (no token auth). Used for
 * privileged, browser-only actions like minting/revoking API keys, so a token
 * can't be used to create more tokens.
 */
export const requireSessionUser = cache(async (): Promise<AuthContext> => {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new AuthError("Not authenticated", 401)
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
})

const ROLE_RANK = { viewer: 0, member: 1, admin: 2, owner: 3 } as const
type Role = keyof typeof ROLE_RANK

/**
 * Require that the current user is a member of `workspaceId` with at least
 * `minRole`. Throws 401/403. Returns the resolved auth context + role.
 */
export const requireWorkspaceMember = cache(
  async function requireWorkspaceMember(
    workspaceId: string,
    minRole: Role = "member"
  ): Promise<AuthContext & { role: Role }> {
    const ctx = await requireUser()
    const membership = await timeAsync("workspace.membership", () =>
      getMembership(workspaceId, ctx.userId)
    )
    if (!membership) {
      throw new AuthError("Not a member of this workspace", 403)
    }
    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
      throw new AuthError("Insufficient role", 403)
    }
    return { ...ctx, role: membership.role }
  }
)

/**
 * Resolve the current user's primary workspace, creating context for the
 * personal-first model. Throws 401 if unauthenticated, 404 if no workspace.
 */
export const requirePrimaryWorkspace = cache(
  async (): Promise<AuthContext & { workspaceId: string }> => {
    const ctx = await requireUser()
    const workspaceId =
      (await getCachedPrimaryWorkspaceId(ctx.userId)) ??
      (await timeAsync("workspace.bootstrap", () =>
        bootstrapWorkspace({
          id: ctx.userId,
          name: ctx.name,
          email: ctx.email,
        })
      ))
    return { ...ctx, workspaceId }
  }
)
