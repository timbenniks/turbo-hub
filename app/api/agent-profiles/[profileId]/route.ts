import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import {
  getAgentProfile,
  updateAgentProfile,
} from "@/lib/services/agentProfiles"
import { agentProfileUpdateSchema } from "@/lib/validation/agent-profiles"

type Params = { params: Promise<{ profileId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { profileId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getAgentProfile(ctx.workspaceId, profileId)) ??
      notFound("Agent profile not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { profileId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = agentProfileUpdateSchema.parse(await req.json())
    return (
      (await updateAgentProfile(ctx, ctx.workspaceId, profileId, input)) ??
      notFound("Agent profile not found")
    )
  })
}
