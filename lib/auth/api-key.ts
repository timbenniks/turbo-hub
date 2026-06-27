import { headers } from "next/headers"

import { apiKeyForToken } from "@/lib/services/api-keys"
import { getUserProfile } from "@/lib/services/users"
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

  const key = await apiKeyForToken(token)
  if (!key) return null
  if (!key.scopes.some((scope) => scope.startsWith("api:"))) return null

  const user = await getUserProfile(key.userId)
  return {
    userId: key.userId,
    name: user?.name,
    email: user?.email,
    image: user?.image,
    apiKeyScopes: key.scopes,
  }
}
