import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { createDecision, listDecisions } from "@/lib/services/decisions"
import { decisionCreateSchema } from "@/lib/validation/decisions"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    return listDecisions(ctx.workspaceId, projectId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = decisionCreateSchema.parse(await req.json())
    return createDecision(ctx, ctx.workspaceId, projectId, input)
  })
}
