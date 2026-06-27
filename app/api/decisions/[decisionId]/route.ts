import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { getDecision, updateDecision } from "@/lib/services/decisions"
import { decisionUpdateSchema } from "@/lib/validation/decisions"

type Params = { params: Promise<{ decisionId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { decisionId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getDecision(ctx.workspaceId, decisionId)) ??
      notFound("Decision not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { decisionId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = decisionUpdateSchema.parse(await req.json())
    const row = await updateDecision(ctx, ctx.workspaceId, decisionId, input)
    return row ?? notFound("Decision not found")
  })
}
