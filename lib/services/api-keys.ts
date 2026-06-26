import { createHash, randomBytes } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { apiKeys } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"

export type ApiKey = typeof apiKeys.$inferSelect
/** Safe to send to the client — never includes the hash. */
export type ApiKeyPublic = Omit<ApiKey, "hashedKey">

const TOKEN_PREFIX = "thub_"

const PUBLIC_COLUMNS = {
  id: apiKeys.id,
  userId: apiKeys.userId,
  name: apiKeys.name,
  prefix: apiKeys.prefix,
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
  name: string
): Promise<{ key: ApiKeyPublic; token: string }> {
  const token = `${TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`
  const [key] = await db
    .insert(apiKeys)
    .values({
      userId: ctx.userId,
      name,
      hashedKey: sha256(token),
      prefix: token.slice(0, 12),
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
 * Resolve a raw bearer token to its owning user id, or null if unknown. Updates
 * last-used as a side effect. Lookup is by hash — the raw token is never stored.
 */
export async function userIdForToken(token: string): Promise<string | null> {
  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(eq(apiKeys.hashedKey, sha256(token)))
    .limit(1)
  if (!row) return null

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
  return row.userId
}
