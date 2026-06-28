import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  agentRuns,
  projects,
  pullRequests,
  repositories,
  tasks,
} from "@/db/schema"
import type { AuthContext } from "@/lib/auth/context"
import { cacheTags, invalidateTags } from "@/lib/cache"
import type { PullRequestState } from "@/lib/enums"
import { resolveGitHubPullRequestLink } from "@/lib/github/linking"
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

export type GitHubWebhookPullRequestInput = {
  repository: {
    owner: string
    name: string
    fullName: string
    url: string
    defaultBranch: string
    githubInstallationId?: string
  }
  pullRequest: {
    externalId: string
    number: number
    title: string
    url: string
    state: PullRequestState
    author?: string | null
    branch?: string | null
    baseBranch?: string | null
    body?: string | null
  }
  action: string
  deliveryId?: string | null
}

export type GitHubWebhookCheckInput = {
  repository: {
    fullName: string
    githubInstallationId?: string
  }
  pullRequests: { number: number }[]
  name: string
  conclusion?: string | null
  htmlUrl?: string | null
  deliveryId?: string | null
  action: string
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

export async function upsertPullRequestFromGitHubWebhook(
  input: GitHubWebhookPullRequestInput
): Promise<PullRequest[]> {
  const repositoryRows = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.provider, "github"),
        eq(repositories.fullName, input.repository.fullName)
      )
    )

  const updatedRows: PullRequest[] = []

  for (const repository of repositoryRows) {
    if (
      input.repository.githubInstallationId &&
      repository.githubInstallationId !== input.repository.githubInstallationId
    ) {
      await db
        .update(repositories)
        .set({ githubInstallationId: input.repository.githubInstallationId })
        .where(eq(repositories.id, repository.id))
    }

    const [existing] = await db
      .select()
      .from(pullRequests)
      .where(
        and(
          eq(pullRequests.workspaceId, repository.workspaceId),
          eq(pullRequests.repositoryId, repository.id),
          eq(pullRequests.number, input.pullRequest.number)
        )
      )
      .limit(1)

    const resolved = await resolveGitHubPullRequestLink({
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      body: input.pullRequest.body,
      headRef: input.pullRequest.branch,
    })

    const projectId = resolved?.projectId ?? existing?.projectId
    if (!projectId) continue

    const values = {
      workspaceId: repository.workspaceId,
      projectId,
      taskId: resolved?.taskId ?? existing?.taskId ?? null,
      runId: resolved?.runId ?? existing?.runId ?? null,
      repositoryId: repository.id,
      provider: "github",
      externalId: input.pullRequest.externalId,
      number: input.pullRequest.number,
      title: input.pullRequest.title,
      url: input.pullRequest.url,
      state: input.pullRequest.state,
      author: input.pullRequest.author ?? null,
      branch: input.pullRequest.branch ?? null,
      baseBranch: input.pullRequest.baseBranch ?? null,
      mergedAt: input.pullRequest.state === "merged" ? new Date() : null,
      closedAt:
        input.pullRequest.state === "closed" ||
        input.pullRequest.state === "merged"
          ? new Date()
          : null,
    } satisfies Partial<typeof pullRequests.$inferInsert>

    const [row] = existing
      ? await db
          .update(pullRequests)
          .set(values)
          .where(
            and(
              eq(pullRequests.workspaceId, repository.workspaceId),
              eq(pullRequests.id, existing.id)
            )
          )
          .returning()
      : await db
          .insert(pullRequests)
          .values(values as typeof pullRequests.$inferInsert)
          .returning()

    if (!row) continue

    if (row.runId) {
      await db
        .update(agentRuns)
        .set({ pullRequestId: row.id })
        .where(
          and(
            eq(agentRuns.workspaceId, repository.workspaceId),
            eq(agentRuns.id, row.runId)
          )
        )

      await recordRunEvent({
        workspaceId: repository.workspaceId,
        projectId: row.projectId,
        taskId: row.taskId,
        actorType: "system",
        runId: row.runId,
        event: {
          type: existing ? "pr_updated" : "pr_opened",
          title: existing
            ? `GitHub PR ${row.number} → ${row.state}`
            : `GitHub PR opened: ${row.title}`,
          metadata: {
            pullRequestId: row.id,
            deliveryId: input.deliveryId,
            action: input.action,
            state: row.state,
            url: row.url,
          },
        },
      })
    }

    if (row.taskId && row.state === "merged") {
      await db
        .update(tasks)
        .set({ status: "done", completedAt: new Date() })
        .where(
          and(
            eq(tasks.workspaceId, repository.workspaceId),
            eq(tasks.id, row.taskId)
          )
        )
    }

    await recordActivity({
      workspaceId: repository.workspaceId,
      projectId: row.projectId,
      taskId: row.taskId,
      actorType: "system",
      type: existing
        ? "github.pull_request.updated"
        : "github.pull_request.linked",
      title: existing
        ? `GitHub updated PR #${row.number}: ${row.title}`
        : `GitHub linked PR #${row.number}: ${row.title}`,
      metadata: {
        pullRequestId: row.id,
        repositoryId: repository.id,
        deliveryId: input.deliveryId,
        action: input.action,
        state: row.state,
      },
    })

    invalidateTags(
      cacheTags.project(repository.workspaceId, row.projectId),
      cacheTags.repositories(repository.workspaceId)
    )
    updatedRows.push(row)
  }

  return updatedRows
}

export async function recordGitHubCheckFromWebhook(
  input: GitHubWebhookCheckInput
): Promise<number> {
  if (input.pullRequests.length === 0) return 0

  const repositoryRows = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.provider, "github"),
        eq(repositories.fullName, input.repository.fullName)
      )
    )

  let recorded = 0

  for (const repository of repositoryRows) {
    if (
      input.repository.githubInstallationId &&
      repository.githubInstallationId !== input.repository.githubInstallationId
    ) {
      continue
    }

    for (const prRef of input.pullRequests) {
      const [pr] = await db
        .select()
        .from(pullRequests)
        .where(
          and(
            eq(pullRequests.workspaceId, repository.workspaceId),
            eq(pullRequests.repositoryId, repository.id),
            eq(pullRequests.number, prRef.number)
          )
        )
        .limit(1)

      if (!pr?.runId) continue

      const passed =
        input.conclusion === "success" ||
        input.conclusion === "neutral" ||
        input.conclusion === "skipped"

      await recordRunEvent({
        workspaceId: repository.workspaceId,
        projectId: pr.projectId,
        taskId: pr.taskId,
        actorType: "system",
        runId: pr.runId,
        event: {
          type: passed ? "check_passed" : "check_failed",
          title: `GitHub check ${passed ? "passed" : "failed"}: ${input.name}`,
          metadata: {
            pullRequestId: pr.id,
            deliveryId: input.deliveryId,
            action: input.action,
            conclusion: input.conclusion,
            url: input.htmlUrl,
          },
        },
      })

      recorded += 1
    }
  }

  return recorded
}
