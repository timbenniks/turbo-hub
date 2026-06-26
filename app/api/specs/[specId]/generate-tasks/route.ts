import type { NextRequest } from "next/server"

import { AuthError, requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { getProjectById } from "@/lib/services/projects"
import { generateTasksFromSpec, getSpec } from "@/lib/services/specs"

type Params = { params: Promise<{ specId: string }> }

export function POST(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { specId } = await params
    const ctx = await requirePrimaryWorkspace()
    const spec = await getSpec(ctx.workspaceId, specId)
    if (!spec) throw new AuthError("Spec not found", 404)
    const project = await getProjectById(ctx.workspaceId, spec.projectId)
    if (!project) throw new AuthError("Project not found", 404)
    return generateTasksFromSpec(ctx, ctx.workspaceId, project, spec)
  })
}
