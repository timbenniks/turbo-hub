import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { promoteToPattern } from "@/lib/services/learnings"

type Params = { params: Promise<{ learningId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { learningId } = await params
    const ctx = await requirePrimaryWorkspace()
    const pattern = await promoteToPattern(ctx, ctx.workspaceId, learningId)
    return pattern ?? notFound("Learning not found")
  })
}
