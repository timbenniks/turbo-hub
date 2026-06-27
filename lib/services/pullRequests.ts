import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { agentRuns, projects, pullRequests, repositories } from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { cacheTags, invalidateTags } from "@/lib/cache"
import { parseGitHubPullRequestUrl } from "@/lib/github/pull-request-url"
import { recordActivity } from "@/lib/services/activity"
import { upsertGitHubRepository } from "@/lib/services/repositories"
import { recordRunEvent } from "@/lib/services/runs"
import { assertWorkspaceMember } from "@/lib/services/workspaces"
import type {
  PullRequestCreateInput,
  PullRequestUpdateInput,
} from "@/lib/validation/pull-requests"

export type PullRequest = typeof pullRequests.$inferSelect
export type PullRequestWithRepository = PullRequest & {
  repository: typeof repositories.$inferSelect | null
}

export async function listPullRequests(
  workspaceId: string,
  projectId: string
): Promise<PullRequest[]> {
  return db
    .select()
    .from(pullRequests)
    .where(
      and(
        eq(pullRequests.workspaceId, workspaceId),
        eq(pullRequests.projectId, projectId)
      )
    )
    .orderBy(desc(pullRequests.updatedAt))
}

export async function listPullRequestsWithRepository(
  workspaceId: string,
  projectId: string
): Promise<PullRequestWithRepository[]> {
  const rows = await db
    .select({ pullRequest: pullRequests, repository: repositories })
    .from(pullRequests)
    .leftJoin(repositories, eq(repositories.id, pullRequests.repositoryId))
    .where(
      and(
        eq(pullRequests.workspaceId, workspaceId),
        eq(pullRequests.projectId, projectId)
      )
    )
    .orderBy(desc(pullRequests.updatedAt))

  return rows.map((row) => ({
    ...row.pullRequest,
    repository: row.repository,
  }))
}

export async function listPullRequestsForRun(
  workspaceId: string,
  runId: string
): Promise<PullRequest[]> {
  return db
    .select()
    .from(pullRequests)
    .where(
      and(
        eq(pullRequests.workspaceId, workspaceId),
        eq(pullRequests.runId, runId)
      )
    )
    .orderBy(desc(pullRequests.updatedAt))
}

export async function getPullRequest(
  workspaceId: string,
  pullRequestId: string
): Promise<PullRequest | null> {
  const [row] = await db
    .select()
    .from(pullRequests)
    .where(
      and(
        eq(pullRequests.workspaceId, workspaceId),
        eq(pullRequests.id, pullRequestId)
      )
    )
    .limit(1)
  return row ?? null
}

/**
 * Create/link a pull request. If a `runId` is given, the PR is linked back to
 * that run (sets `agent_runs.pull_request_id`) and an append-only `pr_opened`
 * event is added to the run timeline. Done inline (not via the runs service) to
 * avoid a circular import.
 */
export async function createPullRequest(
  ctx: AuthContext,
  workspaceId: string,
  projectId: string,
  input: PullRequestCreateInput
): Promise<PullRequest> {
  await assertWorkspaceMember(ctx, workspaceId)
  const parsedPr = parseGitHubPullRequestUrl(input.url)
  const repository = parsedPr
    ? await upsertGitHubRepository(ctx, workspaceId, {
        owner: parsedPr.owner,
        name: parsedPr.repo,
        url: `https://github.com/${parsedPr.fullName}`,
        defaultBranch: input.baseBranch ?? "main",
      })
    : null

  const title =
    input.title ??
    (parsedPr ? `${parsedPr.fullName} #${parsedPr.number}` : "Pull request")

  const [row] = await db
    .insert(pullRequests)
    .values({
      workspaceId,
      projectId,
      taskId: input.taskId ?? null,
      runId: input.runId ?? null,
      repositoryId: repository?.id ?? null,
      provider: input.provider,
      externalId:
        input.externalId ??
        (parsedPr ? `${parsedPr.fullName}#${parsedPr.number}` : null),
      number: input.number ?? parsedPr?.number ?? null,
      title,
      url: parsedPr?.url ?? input.url ?? null,
      state: input.state,
      author: input.author ?? null,
      branch: input.branch ?? null,
      baseBranch: input.baseBranch ?? null,
      createdBy: ctx.userId,
    })
    .returning()

  if (repository) {
    const [project] = await db
      .select({ repositoryId: projects.repositoryId, slug: projects.slug })
      .from(projects)
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId))
      )
      .limit(1)

    if (project && !project.repositoryId) {
      await db
        .update(projects)
        .set({ repositoryId: repository.id })
        .where(
          and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId))
        )
      invalidateTags(
        cacheTags.projectsList(workspaceId),
        cacheTags.project(workspaceId, projectId),
        cacheTags.projectBySlug(project.slug)
      )
    }
  }

  if (input.runId) {
    await db
      .update(agentRuns)
      .set({ pullRequestId: row.id })
      .where(
        and(
          eq(agentRuns.workspaceId, workspaceId),
          eq(agentRuns.id, input.runId)
        )
      )
    await recordRunEvent({
      workspaceId,
      projectId,
      taskId: input.taskId ?? null,
      actorId: ctx.userId,
      runId: input.runId,
      event: {
        type: "pr_opened",
        title: `Linked PR: ${row.title}`,
        metadata: { pullRequestId: row.id, url: row.url },
      },
    })
  }

  await recordActivity({
    workspaceId,
    projectId,
    actorId: ctx.userId,
    type: "pull_request.linked",
    title: `Linked pull request "${row.title}"`,
    metadata: {
      pullRequestId: row.id,
      taskId: input.taskId,
      runId: input.runId,
      repositoryId: row.repositoryId,
      number: row.number,
    },
  })
  return row
}

export async function updatePullRequest(
  ctx: AuthContext,
  workspaceId: string,
  pullRequestId: string,
  input: PullRequestUpdateInput
): Promise<PullRequest | null> {
  await assertWorkspaceMember(ctx, workspaceId)
  const fields: Partial<typeof pullRequests.$inferInsert> = {}
  if (input.title !== undefined) fields.title = input.title
  if (input.url !== undefined) fields.url = input.url ?? null
  if (input.number !== undefined) fields.number = input.number ?? null
  if (input.branch !== undefined) fields.branch = input.branch ?? null
  if (input.baseBranch !== undefined)
    fields.baseBranch = input.baseBranch ?? null
  if (input.state !== undefined) {
    fields.state = input.state
    if (input.state === "merged") fields.mergedAt = new Date()
    if (input.state === "closed") fields.closedAt = new Date()
  }
  if (Object.keys(fields).length === 0)
    return getPullRequest(workspaceId, pullRequestId)

  const [row] = await db
    .update(pullRequests)
    .set(fields)
    .where(
      and(
        eq(pullRequests.workspaceId, workspaceId),
        eq(pullRequests.id, pullRequestId)
      )
    )
    .returning()
  if (!row) return null

  if (row.runId) {
    await recordRunEvent({
      workspaceId,
      projectId: row.projectId,
      taskId: row.taskId,
      actorId: ctx.userId,
      runId: row.runId,
      event: {
        type: "pr_updated",
        title: `PR ${row.title} → ${row.state}`,
        metadata: { pullRequestId: row.id, state: row.state },
      },
    })
  }

  await recordActivity({
    workspaceId,
    projectId: row.projectId,
    actorId: ctx.userId,
    type: "pull_request.updated",
    title: `Updated pull request "${row.title}" (${row.state})`,
    metadata: { pullRequestId: row.id },
  })
  return row
}
