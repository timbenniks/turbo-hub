import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import {
  getPullRequest,
  updatePullRequest,
} from "@/lib/services/pullRequests"
import { pullRequestUpdateSchema } from "@/lib/validation/pull-requests"

type Params = { params: Promise<{ pullRequestId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { pullRequestId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getPullRequest(ctx.workspaceId, pullRequestId)) ??
      notFound("Pull request not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { pullRequestId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = pullRequestUpdateSchema.parse(await req.json())
    return (
      (await updatePullRequest(ctx, ctx.workspaceId, pullRequestId, input)) ??
      notFound("Pull request not found")
    )
  })
}
