import { createHash, randomBytes } from "node:crypto"
import { and, desc, eq, gt, isNull, or } from "drizzle-orm"

import { db } from "@/db"
import { apiKeys } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { API_KEY_SCOPES, type ApiKeyScope } from "@/lib/enums"
import type { ApiKeyCreateInput } from "@/lib/validation/api-keys"

export type ApiKey = typeof apiKeys.$inferSelect
/** Safe to send to the client — never includes the hash. */
export type ApiKeyPublic = Omit<ApiKey, "hashedKey">

const TOKEN_PREFIX = "thub_"
const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000

const PUBLIC_COLUMNS = {
  id: apiKeys.id,
  userId: apiKeys.userId,
  name: apiKeys.name,
  prefix: apiKeys.prefix,
  scopes: apiKeys.scopes,
  expiresAt: apiKeys.expiresAt,
  lastUsedAt: apiKeys.lastUsedAt,
  createdAt: apiKeys.createdAt,
} as const

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export async function listApiKeys(userId: string): Promise<ApiKeyPublic[]> {
  return db
    .select(PUBLIC_COLUMNS)
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt))
}

/**
 * Mint a new token. Returns the raw token exactly once — it is hashed before
 * storage and can never be recovered afterwards.
 */
export async function createApiKey(
  ctx: AuthContext,
  input: ApiKeyCreateInput
): Promise<{ key: ApiKeyPublic; token: string }> {
  const token = `${TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`
  const [key] = await db
    .insert(apiKeys)
    .values({
      userId: ctx.userId,
      name: input.name,
      hashedKey: sha256(token),
      prefix: token.slice(0, 12),
      scopes: input.scopes,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning(PUBLIC_COLUMNS)
  return { key, token }
}

/** Hard-revoke a key. Scoped to the owner so users can't revoke others' keys. */
export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const [row] = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
    .returning({ id: apiKeys.id })
  return Boolean(row)
}

/**
 * Resolve a raw bearer token to its owning user id, or null if unknown/expired.
 * Lookup is by hash — the raw token is never stored. `lastUsedAt` is throttled
 * so hot MCP/API clients do not turn every authenticated request into a write.
 */
export async function apiKeyForToken(token: string): Promise<{
  id: string
  userId: string
  scopes: ApiKeyScope[]
} | null> {
  const [row] = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.hashedKey, sha256(token)),
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date()))
      )
    )
    .limit(1)
  if (!row) return null

  const now = Date.now()
  const lastUsed = row.lastUsedAt?.getTime() ?? 0
  if (now - lastUsed > LAST_USED_UPDATE_INTERVAL_MS) {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(now) })
      .where(eq(apiKeys.id, row.id))
  }

  return {
    id: row.id,
    userId: row.userId,
    scopes: normalizeScopes(row.scopes),
  }
}

export async function userIdForToken(token: string): Promise<string | null> {
  const key = await apiKeyForToken(token)
  return key?.userId ?? null
}

function normalizeScopes(scopes: ApiKeyScope[] | null): ApiKeyScope[] {
  const allowed = new Set<ApiKeyScope>(API_KEY_SCOPES)
  return (scopes ?? []).filter((scope): scope is ApiKeyScope =>
    allowed.has(scope)
  )
}
