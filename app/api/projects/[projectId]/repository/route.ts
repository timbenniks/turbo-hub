import type { NextRequest } from "next/server"

import { requireProject } from "@/lib/api/guards"
import { handle } from "@/lib/api/respond"
import { linkProjectRepository } from "@/lib/services/repositories"
import { projectRepositoryLinkSchema } from "@/lib/validation/repositories"

type Params = { params: Promise<{ projectId: string }> }

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = projectRepositoryLinkSchema.parse(await req.json())
    return linkProjectRepository(ctx, ctx.workspaceId, projectId, input)
  })
}
