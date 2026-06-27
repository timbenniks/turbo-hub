import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import {
  createAgentProfile,
  listAgentProfiles,
} from "@/lib/services/agentProfiles"
import { agentProfileCreateSchema } from "@/lib/validation/agent-profiles"

export function GET() {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    return listAgentProfiles(ctx.workspaceId)
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = agentProfileCreateSchema.parse(await req.json())
    return createAgentProfile(ctx, ctx.workspaceId, input)
  })
}
