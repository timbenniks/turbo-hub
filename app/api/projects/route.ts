import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { createProject, listProjects } from "@/lib/services/projects"
import {
  projectCreateSchema,
  projectListFiltersSchema,
} from "@/lib/validation/projects"

export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const filters = projectListFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    )
    return listProjects(ctx.workspaceId, filters)
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = projectCreateSchema.parse(await req.json())
    return createProject(ctx, ctx.workspaceId, input)
  })
}
