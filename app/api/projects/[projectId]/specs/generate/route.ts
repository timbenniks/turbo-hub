import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { generateSpecForProject } from "@/lib/services/specs"
import { specGenerateSchema } from "@/lib/validation/specs"

type Params = { params: Promise<{ projectId: string }> }

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx, project } = await requireProject(projectId)
    const { instruction, planId } = specGenerateSchema.parse(await req.json())
    return generateSpecForProject(
      ctx,
      ctx.workspaceId,
      project,
      instruction,
      planId
    )
  })
}
