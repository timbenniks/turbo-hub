import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { deleteTag, updateTag } from "@/lib/services/tags"
import { tagUpdateSchema } from "@/lib/validation/tags"

type Params = { params: Promise<{ tagId: string }> }

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { tagId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = tagUpdateSchema.parse(await req.json())
    const tag = await updateTag(ctx.workspaceId, tagId, input)
    return tag ?? notFound("Tag not found")
  })
}

export function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { tagId } = await params
    const ctx = await requirePrimaryWorkspace()
    const tag = await deleteTag(ctx.workspaceId, tagId)
    return tag ?? notFound("Tag not found")
  })
}
