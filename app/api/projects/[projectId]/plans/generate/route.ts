import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { generatePlanForProject } from "@/lib/services/plans"
import { planGenerateSchema } from "@/lib/validation/plans"

type Params = { params: Promise<{ projectId: string }> }

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx, project } = await requireProject(projectId)
    const { idea } = planGenerateSchema.parse(await req.json())
    return generatePlanForProject(ctx, ctx.workspaceId, project, idea)
  })
}
