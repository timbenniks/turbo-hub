import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { markSpecReady } from "@/lib/services/specs"

type Params = { params: Promise<{ specId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { specId } = await params
    const ctx = await requirePrimaryWorkspace()
    const spec = await markSpecReady(ctx, ctx.workspaceId, specId)
    return spec ?? notFound("Spec not found")
  })
}
