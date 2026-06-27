import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { getLearning, updateLearning } from "@/lib/services/learnings"
import { learningUpdateSchema } from "@/lib/validation/learnings"

type Params = { params: Promise<{ learningId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { learningId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getLearning(ctx.workspaceId, learningId)) ??
      notFound("Learning not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { learningId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = learningUpdateSchema.parse(await req.json())
    const row = await updateLearning(ctx, ctx.workspaceId, learningId, input)
    return row ?? notFound("Learning not found")
  })
}
