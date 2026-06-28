import { NextResponse } from "next/server"

import { handle } from "@/lib/api/respond"
import {
  getCachedPrimaryWorkspaceId,
  requireSessionUser,
} from "@/lib/auth/context"
import { createGitHubInstallState } from "@/lib/github/install-state"
import { githubAppInstallationUrl } from "@/lib/services/githubInstallations"
import { bootstrapWorkspace } from "@/lib/services/workspaces"

export function GET() {
  return handle(async () => {
    const ctx = await requireSessionUser()
    const workspaceId =
      (await getCachedPrimaryWorkspaceId(ctx.userId)) ??
      (await bootstrapWorkspace({
        id: ctx.userId,
        name: ctx.name,
        email: ctx.email,
      }))

    const url = await githubAppInstallationUrl(
      createGitHubInstallState({ userId: ctx.userId, workspaceId })
    )
    return NextResponse.redirect(url)
  })
}
