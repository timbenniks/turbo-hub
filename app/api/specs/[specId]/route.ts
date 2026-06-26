import type { NextRequest } from "next/server"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { getSpec, updateSpec } from "@/lib/services/specs"
import { specUpdateSchema } from "@/lib/validation/specs"

type Params = { params: Promise<{ specId: string }> }

export function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { specId } = await params
    const ctx = await requirePrimaryWorkspace()
    return (
      (await getSpec(ctx.workspaceId, specId)) ?? notFound("Spec not found")
    )
  })
}

export function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { specId } = await params
    const ctx = await requirePrimaryWorkspace()
    const input = specUpdateSchema.parse(await req.json())
    const spec = await updateSpec(ctx, ctx.workspaceId, specId, input)
    return spec ?? notFound("Spec not found")
  })
}
