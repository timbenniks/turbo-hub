import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { deletePlan, getPlan, updatePlan } from "@/lib/services/plans"
import { planUpdateSchema } from "@/lib/validation/plans"

type Params = { params: Promise<{ planId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { planId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getPlan(ctx.workspaceId, planId)) ?? notFound("Plan not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { planId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = planUpdateSchema.parse(await req.json())
    const plan = await updatePlan(ctx, ctx.workspaceId, planId, input)
    return plan ?? notFound("Plan not found")
  })
}

export function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { planId } = await params
    const ctx = await requirePrimaryWorkspace()
    const plan = await deletePlan(ctx, ctx.workspaceId, planId)
    return plan ?? notFound("Plan not found")
  })
}
