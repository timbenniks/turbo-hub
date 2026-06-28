import { NextResponse, type NextRequest } from "next/server"

import { handle } from "@/lib/api/respond"
import {
  getCachedPrimaryWorkspaceId,
  requireSessionUser,
} from "@/lib/auth/context"
import { verifyGitHubInstallState } from "@/lib/github/install-state"
import { syncGitHubInstallation } from "@/lib/services/githubInstallations"

export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = await requireSessionUser()
    const workspaceId = await getCachedPrimaryWorkspaceId(ctx.userId)
    if (!workspaceId) {
      return NextResponse.redirect(
        new URL("/settings?github=missing-workspace", req.url)
      )
    }

    const params = req.nextUrl.searchParams
    const setupAction = params.get("setup_action")
    const installationId = params.get("installation_id")

    verifyGitHubInstallState(params.get("state"), {
      userId: ctx.userId,
      workspaceId,
    })

    if (!installationId || setupAction === "request") {
      return NextResponse.redirect(
        new URL("/settings?github=requested", req.url)
      )
    }

    await syncGitHubInstallation(ctx, workspaceId, installationId)
    return NextResponse.redirect(new URL("/settings?github=installed", req.url))
  })
}
