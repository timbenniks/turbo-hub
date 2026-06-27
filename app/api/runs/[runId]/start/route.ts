import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { startRun } from "@/lib/services/runs"

type Params = { params: Promise<{ runId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (await startRun(ctx, ctx.workspaceId, runId)) ?? notFound("Run not found")
  })
}
