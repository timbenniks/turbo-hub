import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { markPlanActive } from "@/lib/services/plans"

type Params = { params: Promise<{ planId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { planId } = await params
    const ctx = await requirePrimaryWorkspace()
    const plan = await markPlanActive(ctx, ctx.workspaceId, planId)
    return plan ?? notFound("Plan not found")
  })
}
