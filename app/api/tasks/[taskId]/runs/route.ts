import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { createRun, listTaskRuns } from "@/lib/services/runs"
import { getTask } from "@/lib/services/tasks"
import { runCreateSchema } from "@/lib/validation/runs"

type Params = { params: Promise<{ taskId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    return listTaskRuns(ctx.workspaceId, taskId)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { taskId } = await params
    const ctx = await requirePrimaryWorkspace()
    const task = await getTask(ctx.workspaceId, taskId)
    if (!task) return notFound("Task not found")
    const input = runCreateSchema.parse(await req.json().catch(() => ({})))
    return createRun(ctx, ctx.workspaceId, task.projectId, {
      ...input,
      taskId,
    })
  })
}
