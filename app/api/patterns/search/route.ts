import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { searchPatterns } from "@/lib/services/patterns"
import { patternSearchSchema } from "@/lib/validation/patterns"

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = patternSearchSchema.parse(await req.json())
    return searchPatterns(ctx.workspaceId, input)
  })
}
