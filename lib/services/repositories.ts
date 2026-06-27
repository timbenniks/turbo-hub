import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { projects, repositories } from "@/db/schema"
import { AuthError, type AuthContext } from "@/lib/auth/context"
import { cacheTags, invalidateTags } from "@/lib/cache"
import { recordActivity } from "@/lib/services/activity"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  ProjectRepositoryLinkInput,
  RepositoryCreateInput,
} from "@/lib/validation/repositories"

export type Repository = typeof repositories.$inferSelect

function normalizeRepository(input: RepositoryCreateInput) {
  const owner = input.owner.trim()
  const name = input.name.trim()
  const fullName = `${owner}/${name}`

  return {
    provider: input.provider,
    owner,
    name,
    fullName,
    url: input.url ?? `https://github.com/${fullName}`,
    defaultBranch: input.defaultBranch,
    githubInstallationId: input.githubInstallationId ?? null,
  }
}

function parseRepositoryUrl(urlText?: string | null) {
  if (!urlText) return null

  let url: URL
  try {
    url = new URL(urlText)
  } catch {
    return null
  }

  if (url.hostname.toLowerCase() !== "github.com") return null

  const [owner, name] = url.pathname.split("/").filter(Boolean)
  if (!owner || !name) return null

  return {
    owner,
    name: name.replace(/\.git$/, ""),
    url: `https://github.com/${owner}/${name.replace(/\.git$/, "")}`,
  }
}

export async function listRepositories(
  workspaceId: string
): Promise<Repository[]> {
  return db
    .select()
    .from(repositories)
    .where(eq(repositories.workspaceId, workspaceId))
    .orderBy(repositories.fullName)
}

export async function getRepository(
  workspaceId: string,
  repositoryId: string
): Promise<Repository | null> {
  const [row] = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.workspaceId, workspaceId),
        eq(repositories.id, repositoryId)
      )
    )
    .limit(1)
  return row ?? null
}

export async function findRepositoryByFullName(
  workspaceId: string,
  fullName: string
): Promise<Repository | null> {
  const [row] = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.workspaceId, workspaceId),
        eq(repositories.provider, "github"),
        eq(repositories.fullName, fullName)
      )
    )
    .limit(1)
  return row ?? null
}

export async function upsertRepository(
  ctx: AuthContext,
  workspaceId: string,
  input: RepositoryCreateInput
): Promise<Repository> {
  await assertWorkspaceMember(ctx, workspaceId)
  const values = normalizeRepository(input)
  const [row] = await db
    .insert(repositories)
    .values({
      workspaceId,
      ...values,
      createdBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [
        repositories.workspaceId,
        repositories.provider,
        repositories.fullName,
      ],
      set: {
        owner: values.owner,
        name: values.name,
        url: values.url,
        defaultBranch: values.defaultBranch,
        githubInstallationId: values.githubInstallationId,
      },
    })
    .returning()

  invalidateTags(cacheTags.repositories(workspaceId))
  return row
}

export async function upsertGitHubRepository(
  ctx: AuthContext,
  workspaceId: string,
  input: Omit<RepositoryCreateInput, "provider">
) {
  return upsertRepository(ctx, workspaceId, { ...input, provider: "github" })
}

export async function linkProjectRepository(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: ProjectRepositoryLinkInput
): Promise<Repository> {
  await assertWorkspaceMember(ctx, workspaceId)

  let repository =
    input.repositoryId !== undefined
      ? await getRepository(workspaceId, input.repositoryId)
      : null

  if (!repository) {
    const parsed = parseRepositoryUrl(input.url)
    const owner = input.owner ?? parsed?.owner
    const name = input.name ?? parsed?.name
    if (!owner || !name) {
      throw new AuthError("Repository URL or owner/name is required", 400)
    }
    repository = await upsertGitHubRepository(ctx, workspaceId, {
      owner,
      name,
      url: parsed?.url ?? input.url,
      defaultBranch: input.defaultBranch,
    })
  }

  const [project] = await db
    .update(projects)
    .set({ repositoryId: repository.id })
    .where(
      and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId))
    )
    .returning()

  if (!project) throw new AuthError("Project not found", 404)

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "project.repository_linked",
    title: `Linked repository ${repository.fullName}`,
    metadata: { repositoryId: repository.id, fullName: repository.fullName },
  })

  invalidateTags(
    cacheTags.projectsList(workspaceId),
    cacheTags.project(workspaceId, projectId),
    cacheTags.projectBySlug(project.slug),
    cacheTags.repositories(workspaceId)
  )

  return repository
}
