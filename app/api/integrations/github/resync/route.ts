import { handle } from "@/lib/api/respond"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { resyncGitHubInstallation } from "@/lib/services/githubInstallations"

export function POST() {
  return handle(async () => {
    const ctx = await requirePrimaryWorkspace()
    return resyncGitHubInstallation(ctx, ctx.workspaceId)
  })
}
