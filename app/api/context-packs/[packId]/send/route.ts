import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { sendContextPack } from "@/lib/services/contextPacks"

type Params = { params: Promise<{ packId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { packId } = await params
    const ctx = await requirePrimaryWorkspace()
    const row = await sendContextPack(ctx, ctx.workspaceId, packId)
    return row ?? notFound("Context pack not found")
  })
}
