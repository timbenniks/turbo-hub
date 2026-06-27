import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { agentProfiles } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  AgentProfileCreateInput,
  AgentProfileUpdateInput,
} from "@/lib/validation/agent-profiles"

export type AgentProfile = typeof agentProfiles.$inferSelect

export async function listAgentProfiles(
  workspaceId: string
): Promise<AgentProfile[]> {
  return db
    .select()
    .from(agentProfiles)
    .where(eq(agentProfiles.workspaceId, workspaceId))
    .orderBy(desc(agentProfiles.updatedAt))
}

export async function getAgentProfile(
  workspaceId: string,
  profileId: string
): Promise<AgentProfile | null> {
  const [row] = await db
    .select()
    .from(agentProfiles)
    .where(
      and(
        eq(agentProfiles.workspaceId, workspaceId),
        eq(agentProfiles.id, profileId)
      )
    )
    .limit(1)
  return row ?? null
}

export async function createAgentProfile(
  ctx: AuthContext,
  workspaceId: string,
  input: AgentProfileCreateInput
): Promise<AgentProfile> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .insert(agentProfiles)
    .values({
      workspaceId,
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      capabilities: input.capabilities ?? [],
      defaultModel: input.defaultModel ?? null,
      configuration: input.configuration ?? null,
      isActive: input.isActive ?? true,
      createdBy: ctx.userId,
    })
    .returning()
  return row
}

export async function updateAgentProfile(
  ctx: AuthContext,
  workspaceId: string,
  profileId: string,
  input: AgentProfileUpdateInput
): Promise<AgentProfile | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof agentProfiles.$inferInsert> = {}
  if (input.name !== undefined) fields.name = input.name
  if (input.type !== undefined) fields.type = input.type
  if (input.description !== undefined)
    fields.description = input.description ?? null
  if (input.capabilities !== undefined)
    fields.capabilities = input.capabilities ?? []
  if (input.defaultModel !== undefined)
    fields.defaultModel = input.defaultModel ?? null
  if (input.configuration !== undefined)
    fields.configuration = input.configuration ?? null
  if (input.isActive !== undefined) fields.isActive = input.isActive
  if (Object.keys(fields).length === 0)
    return getAgentProfile(workspaceId, profileId)

  const [row] = await db
    .update(agentProfiles)
    .set(fields)
    .where(
      and(
        eq(agentProfiles.workspaceId, workspaceId),
        eq(agentProfiles.id, profileId)
      )
    )
    .returning()
  return row ?? null
}
