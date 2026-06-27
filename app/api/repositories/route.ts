import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listRepositories, upsertRepository } from "@/lib/services/repositories"
import { repositoryCreateSchema } from "@/lib/validation/repositories"

export function GET() {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    return listRepositories(ctx.workspaceId)
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    const input = repositoryCreateSchema.parse(await req.json())
    return upsertRepository(ctx, ctx.workspaceId, input)
  })
}
