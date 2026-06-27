import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { listProjectRuns } from "@/lib/services/runs"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    return listProjectRuns(ctx.workspaceId, projectId)
  })
}
