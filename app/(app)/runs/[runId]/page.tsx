import { notFound } from "next/navigation"

import { RunDetail } from "@/components/run-detail"
import { getContextPack } from "@/lib/services/contextPacks"
import { getProjectById } from "@/lib/services/projects"
import { listPullRequestsForRun } from "@/lib/services/pullRequests"
import { getRun, listRunEvents } from "@/lib/services/runs"
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

    const [events, pullRequests, project, task, contextPack] = await Promise.all(
      [
        listRunEvents(ctx.workspaceId, runId),
        listPullRequestsForRun(ctx.workspaceId, runId),
        getProjectById(ctx.workspaceId, run.projectId),
        run.taskId ? getTask(ctx.workspaceId, run.taskId) : null,
        run.contextPackId
          ? getContextPack(ctx.workspaceId, run.contextPackId)
          : null,
      ]
    )
    if (!project) notFound()

    return (
      <div className="mx-auto max-w-3xl">
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
          task={task ? { id: task.id, title: task.title } : null}
          contextPackTitle={contextPack?.title ?? null}
          projectId={run.projectId}
          projectSlug={project.slug}
        />
      </div>
    )
  })
}
