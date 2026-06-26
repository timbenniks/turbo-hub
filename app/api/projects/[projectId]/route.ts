import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import {
  archiveProject,
  getProjectById,
  updateProject,
} from "@/lib/services/projects"
import { projectUpdateSchema } from "@/lib/validation/projects"

type Params = { params: Promise<{ projectId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const ctx = await requirePrimaryWorkspace()
    const project = await getProjectById(ctx.workspaceId, projectId)
    return project ?? notFound("Project not found")
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = projectUpdateSchema.parse(await req.json())
    const project = await updateProject(ctx, ctx.workspaceId, projectId, input)
    return project ?? notFound("Project not found")
  })
}

export function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const ctx = await requirePrimaryWorkspace()
    const project = await archiveProject(ctx, ctx.workspaceId, projectId)
    return project ?? notFound("Project not found or already archived")
  })
}
