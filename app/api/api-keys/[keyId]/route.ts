import type { NextRequest } from "next/server"

import { requireSessionUser } from "@/lib/auth/context"
import { handle, notFound } from "@/lib/api/respond"
import { revokeApiKey } from "@/lib/services/api-keys"

type Params = { params: Promise<{ keyId: string }> }

export function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const { keyId } = await params
    const ctx = await requireSessionUser()
    const ok = await revokeApiKey(ctx.userId, keyId)
    return ok ? { ok: true } : notFound("Key not found")
  })
}
