import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { tags, workspaceMembers, workspaces } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { slugify } from "@/lib/slug"

const DEFAULT_TAGS: { name: string; color: string }[] = [
  { name: "Next.js", color: "#000000" },
  { name: "Drizzle", color: "#c5f74f" },
  { name: "Neon", color: "#00e599" },
  { name: "AI", color: "#8b5cf6" },
  { name: "MCP", color: "#f59e0b" },
  { name: "Prototype", color: "#64748b" },
]

/**
 * The workspace a user belongs to (personal-first model — one per user for now,
 * spec §14.2). Returns the first membership.
 */
export async function getPrimaryWorkspaceId(
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1)
  return row?.workspaceId ?? null
}

/**
 * Create a personal workspace for a brand-new user, add them as owner, and seed
 * a few starter tags. Invoked from the Auth.js createUser event (spec §14.2).
 */
export async function bootstrapWorkspace(user: {
  id: string
  name?: string | null
  email?: string | null
}): Promise<string> {
  const existing = await getPrimaryWorkspaceId(user.id)
  if (existing) return existing

  const label = user.name?.trim() || user.email?.split("@")[0] || "Personal"
  const baseSlug = slugify(`${label}-workspace`) || "workspace"
  // Suffix with a slice of the user id to avoid global slug collisions.
  const slug = `${baseSlug}-${user.id.slice(-6).toLowerCase()}`

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: `${label}'s workspace`,
      slug,
      ownerId: user.id,
    })
    .returning({ id: workspaces.id })

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  })

  await db.insert(tags).values(
    DEFAULT_TAGS.map((t) => ({
      workspaceId: workspace.id,
      name: t.name,
      slug: slugify(t.name),
      color: t.color,
    }))
  )

  return workspace.id
}

/**
 * Confirm a user is a member of a workspace (any role). Returns the membership
 * row or null.
 */
export async function getMembership(workspaceId: string, userId: string) {
  const [row] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1)
  return row ?? null
}

const ROLE_RANK = { viewer: 0, member: 1, admin: 2, owner: 3 } as const
type WorkspaceRole = keyof typeof ROLE_RANK

export class WorkspaceAccessError extends Error {
  status = 403

  constructor(message = "Insufficient workspace access") {
    super(message)
    this.name = "WorkspaceAccessError"
  }
}

export async function assertWorkspaceMember(
  ctx: AuthContext,
  workspaceId: string,
  minRole: WorkspaceRole = "member"
) {
  const membership = await getMembership(workspaceId, ctx.userId)
  if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new WorkspaceAccessError()
  }
}
