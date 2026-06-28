import type { AuthContext } from "@/lib/auth/context"
import { githubApp, githubInstallationOctokit } from "@/lib/github/app"
import { upsertIntegration } from "@/lib/services/integrations"
import { upsertGitHubRepository } from "@/lib/services/repositories"
import { assertWorkspaceMember } from "@/lib/services/workspaces"

export type GitHubInstallationSyncResult = {
  installationId: string
  repositoryCount: number
  accountLogin?: string | null
}

type GitHubRepository = {
  name: string
  full_name: string
  html_url: string
  default_branch?: string | null
  owner: { login: string }
}

export async function githubAppInstallationUrl(state: string) {
  return githubApp().getInstallationUrl({ state })
}

export async function syncGitHubInstallation(
  ctx: AuthContext,
  workspaceId: string,
  installationId: string
): Promise<GitHubInstallationSyncResult> {
  await assertWorkspaceMember(ctx, workspaceId)

  const octokit = await githubInstallationOctokit(installationId)
  const repos = (await octokit.paginate("GET /installation/repositories", {
    per_page: 100,
  })) as GitHubRepository[]

  for (const repo of repos) {
    await upsertGitHubRepository(ctx, workspaceId, {
      owner: repo.owner.login,
      name: repo.name,
      url: repo.html_url,
      defaultBranch: repo.default_branch ?? "main",
      githubInstallationId: installationId,
    })
  }

  const accountLogin = repos[0]?.owner.login ?? null
  await upsertIntegration(ctx, workspaceId, {
    provider: "github",
    name: "GitHub App",
    status: "active",
    config: {
      installationId,
      accountLogin,
      repositoryCount: repos.length,
      syncedAt: new Date().toISOString(),
    },
  })

  return { installationId, repositoryCount: repos.length, accountLogin }
}
