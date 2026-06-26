import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { createPlan, listPlans } from "@/lib/services/plans"
import { planCreateSchema } from "@/lib/validation/plans"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    return listPlans(ctx.workspaceId, projectId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = planCreateSchema.parse(await req.json())
    return createPlan(ctx, ctx.workspaceId, projectId, input)
  })
}
