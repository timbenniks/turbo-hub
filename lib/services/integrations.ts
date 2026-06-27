import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { integrations } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { cacheTags, invalidateTags } from "@/lib/cache"
import { encryptSecret, secretPreview } from "@/lib/crypto"
import { recordActivity } from "@/lib/services/activity"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type { IntegrationCreateInput } from "@/lib/validation/integrations"

export type Integration = Omit<
  typeof integrations.$inferSelect,
  "encryptedSecret"
> & {
  hasSecret: boolean
}

function publicIntegration(row: typeof integrations.$inferSelect): Integration {
  const { encryptedSecret: _encryptedSecret, ...safe } = row
  return { ...safe, hasSecret: Boolean(_encryptedSecret) }
}

export async function listIntegrations(
  workspaceId: string
): Promise<Integration[]> {
  const rows = await db
    .select()
    .from(integrations)
    .where(eq(integrations.workspaceId, workspaceId))
    .orderBy(integrations.provider, integrations.name)
  return rows.map(publicIntegration)
}

export async function upsertIntegration(
  ctx: AuthContext,
  workspaceId: string,
  input: IntegrationCreateInput
): Promise<Integration> {
  await assertWorkspaceMember(ctx, workspaceId)

  const secretFields = input.secret
    ? {
        encryptedSecret: encryptSecret(input.secret),
        secretPreview: secretPreview(input.secret),
      }
    : {}

  const [row] = await db
    .insert(integrations)
    .values({
      workspaceId,
      provider: input.provider,
      name: input.name,
      status: input.status,
      config: input.config,
      ...secretFields,
      createdBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [
        integrations.workspaceId,
        integrations.provider,
        integrations.name,
      ],
      set: {
        status: input.status,
        config: input.config,
        ...secretFields,
      },
    })
    .returning()

  await recordActivity({
    workspaceId,
    actorId: ctx.userId,
    type: "integration.upserted",
    title: `Saved ${input.provider} integration "${input.name}"`,
    metadata: { integrationId: row.id, provider: input.provider },
  })

  invalidateTags(cacheTags.integrations(workspaceId))
  return publicIntegration(row)
}

export async function deleteIntegration(
  ctx: AuthContext,
  workspaceId: string,
  integrationId: string
): Promise<boolean> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .delete(integrations)
    .where(
      and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.id, integrationId)
      )
    )
    .returning()

  if (!row) return false

  await recordActivity({
    workspaceId,
    actorId: ctx.userId,
    type: "integration.deleted",
    title: `Deleted ${row.provider} integration "${row.name}"`,
    metadata: { integrationId: row.id, provider: row.provider },
  })

  invalidateTags(cacheTags.integrations(workspaceId))
  return true
}
