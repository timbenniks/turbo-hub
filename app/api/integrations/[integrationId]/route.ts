import { handle, notFound } from "@/lib/api/respond"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { deleteIntegration } from "@/lib/services/integrations"

type Params = { params: Promise<{ integrationId: string }> }

export function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const { integrationId } = await params
    const ctx = await requirePrimaryWorkspace()
    const ok = await deleteIntegration(ctx, ctx.workspaceId, integrationId)
    return ok ? { ok: true } : notFound("Integration not found")
  })
}
