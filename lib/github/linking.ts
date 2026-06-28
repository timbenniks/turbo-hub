import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { agentRuns, projects, repositories, tasks } from "@/db/schema"

const HUB_METADATA_KEYS = [
  "hub_task_id",
  "hub_run_id",
  "hub_project_id",
] as const

export type HubPullRequestMetadata = Partial<
  Record<(typeof HUB_METADATA_KEYS)[number], string>
>

export type GitHubPrLinkInput = {
  workspaceId: string
  repositoryId: string
  body?: string | null
  headRef?: string | null
}

export type GitHubPrLinkResult = {
  projectId: string
  taskId?: string | null
  runId?: string | null
}

export function parseHubMetadata(body?: string | null): HubPullRequestMetadata {
  if (!body) return {}

  const result: HubPullRequestMetadata = {}
  for (const key of HUB_METADATA_KEYS) {
    const match = body.match(
      new RegExp(`<!--\\s*${key}\\s*:\\s*([^>]+?)\\s*-->`, "i")
    )
    const value = match?.[1]?.trim()
    if (value) result[key] = value
  }
  return result
}

function taskIdPrefixFromBranch(headRef?: string | null) {
  if (!headRef?.startsWith("task/")) return null
  const suffix = headRef.split("-").at(-1)?.trim()
  return suffix && suffix.length >= 6 ? suffix : null
}

export async function resolveGitHubPullRequestLink({
  workspaceId,
  repositoryId,
  body,
  headRef,
}: GitHubPrLinkInput): Promise<GitHubPrLinkResult | null> {
  const metadata = parseHubMetadata(body)

  if (metadata.hub_run_id) {
    const [run] = await db
      .select({
        projectId: agentRuns.projectId,
        taskId: agentRuns.taskId,
        runId: agentRuns.id,
      })
      .from(agentRuns)
      .where(
        and(
          eq(agentRuns.workspaceId, workspaceId),
          eq(agentRuns.id, metadata.hub_run_id)
        )
      )
      .limit(1)
    if (run) return run
  }

  if (metadata.hub_task_id) {
    const [task] = await db
      .select({ projectId: tasks.projectId, taskId: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.id, metadata.hub_task_id)
        )
      )
      .limit(1)
    if (task) {
      return {
        projectId: task.projectId,
        taskId: task.taskId,
        runId: null,
      }
    }
  }

  if (metadata.hub_project_id) {
    const [project] = await db
      .select({ projectId: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.id, metadata.hub_project_id)
        )
      )
      .limit(1)
    if (project) return { projectId: project.projectId }
  }

  const [linkedProject] = await db
    .select({ projectId: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.repositoryId, repositoryId)
      )
    )
    .limit(1)

  if (!linkedProject) return null

  const taskPrefix = taskIdPrefixFromBranch(headRef)
  if (taskPrefix) {
    const projectTasks = await db
      .select({ taskId: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, linkedProject.projectId)
        )
      )
    const task = projectTasks.find((item) => item.taskId.startsWith(taskPrefix))
    if (task) {
      return {
        projectId: linkedProject.projectId,
        taskId: task.taskId,
        runId: null,
      }
    }
  }

  const [repository] = await db
    .select({ fullName: repositories.fullName })
    .from(repositories)
    .where(
      and(
        eq(repositories.workspaceId, workspaceId),
        eq(repositories.id, repositoryId)
      )
    )
    .limit(1)

  return repository ? { projectId: linkedProject.projectId } : null
}
