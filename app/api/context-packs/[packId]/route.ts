import type { NextRequest } from "next/server"
import { z } from "zod"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import {
  getContextPack,
  updateContextPack,
} from "@/lib/services/contextPacks"

type Params = { params: Promise<{ packId: string }> }

const updateSchema = z.object({
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().max(100000).optional(),
})

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { packId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getContextPack(ctx.workspaceId, packId)) ??
      notFound("Context pack not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { packId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = updateSchema.parse(await req.json())
    const row = await updateContextPack(ctx, ctx.workspaceId, packId, input)
    return row ?? notFound("Context pack not found")
  })
}
