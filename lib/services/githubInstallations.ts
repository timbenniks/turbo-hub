import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { integrations, repositories } from "@/db/schema"
import { AuthError, type AuthContext } from "@/lib/auth/context"
import { cacheTags, invalidateTags } from "@/lib/cache"
import { githubApp, githubInstallationOctokit } from "@/lib/github/app"
import { recordActivity } from "@/lib/services/activity"
import { upsertIntegration } from "@/lib/services/integrations"
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

type GitHubIntegrationConfig = {
  installationId?: unknown
  accountLogin?: unknown
  repositoryCount?: unknown
  syncedAt?: unknown
  suspendedAt?: unknown
  deletedAt?: unknown
}

export async function githubAppInstallationUrl(state: string) {
  return githubApp().getInstallationUrl({ state })
}

async function upsertSyncedRepository(input: {
  workspaceId: string
  repo: GitHubRepository
  installationId: string
  createdBy?: string | null
}) {
  const [row] = await db
    .insert(repositories)
    .values({
      workspaceId: input.workspaceId,
      provider: "github",
      owner: input.repo.owner.login,
      name: input.repo.name,
      fullName: input.repo.full_name,
      url: input.repo.html_url,
      defaultBranch: input.repo.default_branch ?? "main",
      githubInstallationId: input.installationId,
      createdBy: input.createdBy ?? null,
    })
    .onConflictDoUpdate({
      target: [
        repositories.workspaceId,
        repositories.provider,
        repositories.fullName,
      ],
      set: {
        owner: input.repo.owner.login,
        name: input.repo.name,
        url: input.repo.html_url,
        defaultBranch: input.repo.default_branch ?? "main",
        githubInstallationId: input.installationId,
      },
    })
    .returning()
  return row
}

async function syncInstallationRepositories(input: {
  workspaceId: string
  installationId: string
  repos: GitHubRepository[]
  actorId?: string | null
}) {
  const fullNames = new Set(input.repos.map((repo) => repo.full_name))

  for (const repo of input.repos) {
    await upsertSyncedRepository({
      workspaceId: input.workspaceId,
      repo,
      installationId: input.installationId,
      createdBy: input.actorId,
    })
  }

  const existing = await db
    .select({ id: repositories.id, fullName: repositories.fullName })
    .from(repositories)
    .where(
      and(
        eq(repositories.workspaceId, input.workspaceId),
        eq(repositories.provider, "github"),
        eq(repositories.githubInstallationId, input.installationId)
      )
    )

  for (const repo of existing) {
    if (fullNames.has(repo.fullName)) continue
    await db
      .update(repositories)
      .set({ githubInstallationId: null })
      .where(eq(repositories.id, repo.id))
  }

  invalidateTags(cacheTags.repositories(input.workspaceId))
}

async function fetchInstallationRepositories(installationId: string) {
  const octokit = await githubInstallationOctokit(installationId)
  return (await octokit.paginate("GET /installation/repositories", {
    per_page: 100,
  })) as GitHubRepository[]
}

export async function syncGitHubInstallation(
  ctx: AuthContext,
  workspaceId: string,
  installationId: string
): Promise<GitHubInstallationSyncResult> {
  await assertWorkspaceMember(ctx, workspaceId)

  const repos = await fetchInstallationRepositories(installationId)
  await syncInstallationRepositories({
    workspaceId,
    installationId,
    repos,
    actorId: ctx.userId,
  })

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

async function matchingGitHubIntegrations(installationId: string) {
  const rows = await db
    .select()
    .from(integrations)
    .where(eq(integrations.provider, "github"))

  return rows.filter((row) => {
    const config = row.config as GitHubIntegrationConfig
    return config.installationId === installationId
  })
}

export async function resyncGitHubInstallation(
  ctx: AuthContext,
  workspaceId: string
): Promise<GitHubInstallationSyncResult> {
  await assertWorkspaceMember(ctx, workspaceId)
  const [row] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, "github"),
        eq(integrations.name, "GitHub App")
      )
    )
    .limit(1)

  const config = row?.config as GitHubIntegrationConfig | undefined
  if (typeof config?.installationId !== "string") {
    throw new AuthError("No GitHub App installation is connected", 400)
  }

  return syncGitHubInstallation(ctx, workspaceId, config.installationId)
}

export async function syncGitHubInstallationForWebhook(
  installationId: string
): Promise<number> {
  const rows = await matchingGitHubIntegrations(installationId)
  if (rows.length === 0) return 0

  const repos = await fetchInstallationRepositories(installationId)
  for (const row of rows) {
    await syncInstallationRepositories({
      workspaceId: row.workspaceId,
      installationId,
      repos,
    })

    const accountLogin = repos[0]?.owner.login ?? null
    await db
      .update(integrations)
      .set({
        status: "active",
        config: {
          ...(row.config as Record<string, unknown>),
          installationId,
          accountLogin,
          repositoryCount: repos.length,
          syncedAt: new Date().toISOString(),
          suspendedAt: null,
          deletedAt: null,
        },
      })
      .where(eq(integrations.id, row.id))

    await recordActivity({
      workspaceId: row.workspaceId,
      actorType: "system",
      type: "github.installation.synced",
      title: `Synced GitHub App installation (${repos.length} repos)`,
      metadata: { installationId, repositoryCount: repos.length },
    })
  }

  return rows.length
}

export async function updateGitHubInstallationLifecycle(input: {
  installationId: string
  status: "active" | "disabled"
  reason: "deleted" | "suspended" | "unsuspended"
}): Promise<number> {
  const rows = await matchingGitHubIntegrations(input.installationId)
  const now = new Date().toISOString()

  for (const row of rows) {
    const config = row.config as Record<string, unknown>
    await db
      .update(integrations)
      .set({
        status: input.status,
        config: {
          ...config,
          installationId: input.installationId,
          suspendedAt: input.reason === "suspended" ? now : null,
          deletedAt: input.reason === "deleted" ? now : null,
        },
      })
      .where(eq(integrations.id, row.id))

    if (input.reason === "deleted" || input.reason === "suspended") {
      await db
        .update(repositories)
        .set({ githubInstallationId: null })
        .where(
          and(
            eq(repositories.workspaceId, row.workspaceId),
            eq(repositories.githubInstallationId, input.installationId)
          )
        )
      invalidateTags(cacheTags.repositories(row.workspaceId))
    }

    await recordActivity({
      workspaceId: row.workspaceId,
      actorType: "system",
      type: `github.installation.${input.reason}`,
      title: `GitHub App installation ${input.reason}`,
      metadata: { installationId: input.installationId },
    })
  }

  return rows.length
}
