import type { NextRequest } from "next/server"

import { AuthError, requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { addDependency, getTask, listDependencies } from "@/lib/services/tasks"
import { taskDependencyCreateSchema } from "@/lib/validation/tasks"

type Params = { params: Promise<{ taskId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    return listDependencies(ctx.workspaceId, taskId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    const task = await getTask(ctx.workspaceId, taskId)
    if (!task) throw new AuthError("Task not found", 404)
    const input = taskDependencyCreateSchema.parse(await req.json())
    return addDependency(ctx, ctx.workspaceId, task.projectId, taskId, input)
  })
}
