import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { cancelRun } from "@/lib/services/runs"

type Params = { params: Promise<{ runId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await cancelRun(ctx, ctx.workspaceId, runId)) ?? notFound("Run not found")
    )
  })
}
