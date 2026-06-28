import type { NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import { AuthError } from "@/lib/auth/context"
import { handleGitHubWebhook, verifyGitHubWebhook } from "@/lib/github/webhooks"

export async function POST(req: NextRequest) {
  return handle(async () => {
    const payload = await req.text()
    await verifyGitHubWebhook({
      payload,
      signature: req.headers.get("x-hub-signature-256"),
    })

    const event = req.headers.get("x-github-event")
    if (!event) throw new AuthError("Missing GitHub event name", 400)

    let parsedPayload: unknown
    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      throw new AuthError("Invalid GitHub webhook JSON", 400)
    }

    return handleGitHubWebhook({
      event,
      deliveryId: req.headers.get("x-github-delivery"),
      payload: parsedPayload,
    })
  })
}
