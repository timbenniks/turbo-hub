import { headers } from "next/headers"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { userIdForToken } from "@/lib/services/api-keys"
import type { AuthContext } from "@/lib/auth/context"

/** Extract a token from the standard `Authorization: Bearer` or `X-API-Key`. */
function tokenFromHeaders(h: Headers): string | null {
  const authz = h.get("authorization")
  const bearer = authz?.match(/^Bearer\s+(.+)$/i)
  if (bearer) return bearer[1].trim() || null

  const apiKey = h.get("x-api-key")?.trim()
  return apiKey || null
}

/**
 * Resolve the caller from a personal access token, if one was sent. This is how
 * external agents, CLIs, and MCP servers authenticate — they send the token in
 * an HTTP header rather than a session cookie. Returns null if no/invalid token.
 */
export async function userFromApiKey(): Promise<AuthContext | null> {
  const token = tokenFromHeaders(await headers())
  if (!token) return null

  const userId = await userIdForToken(token)
  if (!userId) return null

  const [user] = await db
    .select({ name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return {
    userId,
    name: user?.name,
    email: user?.email,
    image: user?.image,
  }
}
