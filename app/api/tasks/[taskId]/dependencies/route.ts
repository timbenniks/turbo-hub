import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
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
    if (!task) return notFound("Task not found")
    const input = taskDependencyCreateSchema.parse(await req.json())
    return addDependency(ctx, ctx.workspaceId, task.projectId, taskId, input)
  })
}
