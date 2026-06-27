import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { createPattern, listPatterns } from "@/lib/services/patterns"
import { patternCreateSchema } from "@/lib/validation/patterns"

export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const includeArchived =
      new URL(req.url).searchParams.get("includeArchived") === "true"
    return listPatterns(ctx.workspaceId, { includeArchived })
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = patternCreateSchema.parse(await req.json())
    return createPattern(ctx, ctx.workspaceId, input)
  })
}
