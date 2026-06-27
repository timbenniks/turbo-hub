import type { NextRequest } from "next/server"

import { requireSessionUser } from "@/lib/auth/context"
import { handle } from "@/lib/api/respond"
import { createApiKey, listApiKeys } from "@/lib/services/api-keys"
import { apiKeyCreateSchema } from "@/lib/validation/api-keys"

export function GET() {
  return handle(async () => {
    const ctx = await requireSessionUser()
    return listApiKeys(ctx.userId)
  })
}

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = await requireSessionUser()
    const input = apiKeyCreateSchema.parse(await req.json())
    return createApiKey(ctx, input)
  })
}
