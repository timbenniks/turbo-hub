import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { createTag, listTags } from "@/lib/services/tags"
import { tagCreateSchema } from "@/lib/validation/tags"

export function GET() {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    return listTags(ctx.workspaceId)
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = tagCreateSchema.parse(await req.json())
    return createTag(ctx.workspaceId, input)
  })
}
