import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { createPullRequest, listPullRequests } from "@/lib/services/pullRequests"
import { pullRequestCreateSchema } from "@/lib/validation/pull-requests"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    return listPullRequests(ctx.workspaceId, projectId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = pullRequestCreateSchema.parse(await req.json())
    return createPullRequest(ctx, ctx.workspaceId, projectId, input)
  })
}
