import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import {
  assembleContextPack,
  listContextPacks,
} from "@/lib/services/contextPacks"
import { contextPackAssembleSchema } from "@/lib/validation/context-packs"

type Params = { params: Promise<{ taskId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    return listContextPacks(ctx.workspaceId, taskId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = contextPackAssembleSchema.parse(
      await req.json().catch(() => ({}))
    )
    const row = await assembleContextPack(ctx, ctx.workspaceId, taskId, input)
    return row ?? notFound("Task not found")
  })
}
