import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { appendRunEvent, listRunEvents } from "@/lib/services/runs"
import { runEventCreateSchema } from "@/lib/validation/runs"

type Params = { params: Promise<{ runId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    return listRunEvents(ctx.workspaceId, runId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = runEventCreateSchema.parse(await req.json())
    const event = await appendRunEvent(ctx, ctx.workspaceId, runId, input)
    return event ?? notFound("Run not found")
  })
}
