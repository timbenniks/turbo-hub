import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import {
  listIntegrations,
  upsertIntegration,
} from "@/lib/services/integrations"
import { integrationCreateSchema } from "@/lib/validation/integrations"

export function GET() {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    return listIntegrations(ctx.workspaceId)
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = integrationCreateSchema.parse(await req.json())
    return upsertIntegration(ctx, ctx.workspaceId, input)
  })
}
