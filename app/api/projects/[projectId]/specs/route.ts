import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { createSpec, listSpecs } from "@/lib/services/specs"
import { specCreateSchema } from "@/lib/validation/specs"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    return listSpecs(ctx.workspaceId, projectId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = specCreateSchema.parse(await req.json())
    return createSpec(ctx, ctx.workspaceId, projectId, input)
  })
}
