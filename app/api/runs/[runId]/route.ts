import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { getRun, listRunEvents, updateRun } from "@/lib/services/runs"
import { runUpdateSchema } from "@/lib/validation/runs"

type Params = { params: Promise<{ runId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    const run = await getRun(ctx.workspaceId, runId)
    if (!run) return notFound("Run not found")
    const events = await listRunEvents(ctx.workspaceId, runId)
    return { ...run, events }
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = runUpdateSchema.parse(await req.json())
    const run = await updateRun(ctx, ctx.workspaceId, runId, input)
    return run ?? notFound("Run not found")
  })
}
