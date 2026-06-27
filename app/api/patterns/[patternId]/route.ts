import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import {
  archivePattern,
  getPattern,
  updatePattern,
} from "@/lib/services/patterns"
import { patternUpdateSchema } from "@/lib/validation/patterns"

type Params = { params: Promise<{ patternId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { patternId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getPattern(ctx.workspaceId, patternId)) ??
      notFound("Pattern not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { patternId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = patternUpdateSchema.parse(await req.json())
    const row = await updatePattern(ctx, ctx.workspaceId, patternId, input)
    return row ?? notFound("Pattern not found")
  })
}

export function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { patternId } = await params
    const ctx = await requirePrimaryWorkspace()
    const row = await archivePattern(ctx, ctx.workspaceId, patternId)
    return row ?? notFound("Pattern not found")
  })
}
