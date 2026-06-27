import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { approveContextPack } from "@/lib/services/contextPacks"

type Params = { params: Promise<{ packId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { packId } = await params
    const ctx = await requirePrimaryWorkspace()
    const row = await approveContextPack(ctx, ctx.workspaceId, packId)
    return row ?? notFound("Context pack not found or not in draft status")
  })
}
