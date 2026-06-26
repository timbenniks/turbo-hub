import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requireProject } from "@/lib/api/guards"
import { createTask, listTasks } from "@/lib/services/tasks"
import { taskCreateSchema, taskListFiltersSchema } from "@/lib/validation/tasks"

type Params = { params: Promise<{ projectId: string }> }

export function GET(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const filters = taskListFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    )
    return listTasks(ctx.workspaceId, projectId, filters)
  })
}

export function POST(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { projectId } = await params
    const { ctx } = await requireProject(projectId)
    const input = taskCreateSchema.parse(await req.json())
    return createTask(ctx, ctx.workspaceId, projectId, input)
  })
}
