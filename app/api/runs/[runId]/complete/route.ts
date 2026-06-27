import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { completeRun } from "@/lib/services/runs"
import { runCompleteSchema } from "@/lib/validation/runs"

type Params = { params: Promise<{ runId: string }> }

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = runCompleteSchema.parse(await req.json().catch(() => ({})))
    return (
      (await completeRun(ctx, ctx.workspaceId, runId, input)) ??
      notFound("Run not found")
    )
  })
}
