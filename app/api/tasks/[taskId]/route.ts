import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { getTask, updateTask } from "@/lib/services/tasks"
import { taskUpdateSchema } from "@/lib/validation/tasks"

type Params = { params: Promise<{ taskId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getTask(ctx.workspaceId, taskId)) ?? notFound("Task not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = taskUpdateSchema.parse(await req.json())
    const task = await updateTask(ctx, ctx.workspaceId, taskId, input)
    return task ?? notFound("Task not found")
  })
}
