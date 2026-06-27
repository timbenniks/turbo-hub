import { notFound } from "next/navigation"

import { RunDetail } from "@/components/run-detail"
import { getContextPack } from "@/lib/services/contextPacks"
import { listPlans } from "@/lib/services/plans"
import { getProjectById } from "@/lib/services/projects"
import { listPullRequestsForRun } from "@/lib/services/pullRequests"
import { getRepository } from "@/lib/services/repositories"
import { getRun, listRunEvents } from "@/lib/services/runs"
import { getSpec } from "@/lib/services/specs"
import { getTask } from "@/lib/services/tasks"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { timeAsync } from "@/lib/timing"

export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  return timeAsync("render.run", async () => {
    const { runId } = await params
    const ctx = await requirePrimaryWorkspace()
    const run = await getRun(ctx.workspaceId, runId)
    if (!run) notFound()

    const [events, pullRequests, project, task, contextPack] =
      await Promise.all([
        listRunEvents(ctx.workspaceId, runId),
        listPullRequestsForRun(ctx.workspaceId, runId),
        getProjectById(ctx.workspaceId, run.projectId),
        run.taskId ? getTask(ctx.workspaceId, run.taskId) : null,
        run.contextPackId
          ? getContextPack(ctx.workspaceId, run.contextPackId)
          : null,
      ])
    if (!project) notFound()
    const [plans, spec, repository] = await Promise.all([
      listPlans(ctx.workspaceId, project.id),
      task?.specId ? getSpec(ctx.workspaceId, task.specId) : null,
      project.repositoryId
        ? getRepository(ctx.workspaceId, project.repositoryId)
        : null,
    ])
    const plan =
      plans.find((p) => p.id === spec?.planId) ??
      plans.find((p) => p.status === "active") ??
      null

    return (
      <RunDetail
        run={{
          id: run.id,
          status: run.status,
          runnerType: run.runnerType,
          prompt: run.prompt,
          branchName: run.branchName,
          summary: run.summary,
          error: run.error,
        }}
        events={events.map((e) => ({
          id: e.id,
          type: e.type,
          title: e.title,
          body: e.body,
          createdAt: e.createdAt.toISOString(),
        }))}
        pullRequests={pullRequests.map((pr) => ({
          id: pr.id,
          title: pr.title,
          url: pr.url,
          state: pr.state,
          branch: pr.branch,
        }))}
        project={{ id: project.id, name: project.name, slug: project.slug }}
        plan={
          plan ? { id: plan.id, title: plan.title, status: plan.status } : null
        }
        spec={
          spec ? { id: spec.id, title: spec.title, status: spec.status } : null
        }
        task={
          task
            ? {
                id: task.id,
                title: task.title,
                status: task.status,
                acceptanceCriteria: task.acceptanceCriteria,
              }
            : null
        }
        repository={
          repository
            ? {
                id: repository.id,
                fullName: repository.fullName,
                url: repository.url,
                defaultBranch: repository.defaultBranch,
              }
            : null
        }
        contextPack={
          contextPack
            ? {
                id: contextPack.id,
                title: contextPack.title,
                status: contextPack.status,
              }
            : null
        }
        projectId={run.projectId}
        projectSlug={project.slug}
      />
    )
  })
}
