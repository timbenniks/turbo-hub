import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { createPullRequest } from "@/lib/services/pullRequests"
import { getRun } from "@/lib/services/runs"
import { pullRequestCreateSchema } from "@/lib/validation/pull-requests"

type Params = { params: Promise<{ runId: string }> }

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    const run = await getRun(ctx.workspaceId, runId)
    if (!run) return notFound("Run not found")
    const input = pullRequestCreateSchema.parse(await req.json())
    return createPullRequest(ctx, ctx.workspaceId, run.projectId, {
      ...input,
      runId,
      taskId: input.taskId ?? run.taskId ?? undefined,
    })
  })
}
