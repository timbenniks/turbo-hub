import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { recordPatternUsage } from "@/lib/services/patterns"

type Params = { params: Promise<{ patternId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { patternId } = await params
    const ctx = await requirePrimaryWorkspace()
    const row = await recordPatternUsage(ctx, ctx.workspaceId, patternId)
    return row ?? notFound("Pattern not found")
  })
}
