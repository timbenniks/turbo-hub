import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { createLearning, listLearnings } from "@/lib/services/learnings"
import { learningCreateSchema } from "@/lib/validation/learnings"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    return listLearnings(ctx.workspaceId, projectId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = learningCreateSchema.parse(await req.json())
    return createLearning(ctx, ctx.workspaceId, projectId, input)
  })
}
