import { notFound } from "next/navigation"

import { SpecDetail } from "@/components/spec-detail"
import { listPlans } from "@/lib/services/plans"
import { listPullRequests } from "@/lib/services/pullRequests"
import { listProjectRuns } from "@/lib/services/runs"
import { getSpec } from "@/lib/services/specs"
import { listTasks } from "@/lib/services/tasks"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../../project-context"

export default async function SpecDetailPage({
  params,
}: {
  params: Promise<{ slug: string; specId: string }>
}) {
  return timeAsync("render.project.spec-detail", async () => {
    const { slug, specId } = await params
    const { workspaceId, project } = await loadProject(slug)
    const spec = await getSpec(workspaceId, specId)
    if (!spec || spec.projectId !== project.id) notFound()

    const [plans, tasks, runs, pullRequests] = await Promise.all([
      listPlans(workspaceId, project.id),
      listTasks(workspaceId, project.id),
      listProjectRuns(workspaceId, project.id),
      listPullRequests(workspaceId, project.id),
    ])
    const specTasks = tasks.filter((task) => task.specId === spec.id)
    const specTaskIds = new Set(specTasks.map((task) => task.id))
    const prByTaskId: Record<string, { state: string; url: string | null }> = {}
    for (const pr of pullRequests) {
      if (pr.taskId && specTaskIds.has(pr.taskId) && !prByTaskId[pr.taskId]) {
        prByTaskId[pr.taskId] = { state: pr.state, url: pr.url }
      }
    }

    return (
      <SpecDetail
        slug={slug}
        project={{ name: project.name }}
        hasRepository={Boolean(project.repositoryId)}
        plan={(() => {
          const plan =
            plans.find((row) => row.id === spec.planId) ??
            plans.find((row) => row.status === "active") ??
            null
          return plan
            ? { id: plan.id, title: plan.title, status: plan.status }
            : null
        })()}
        spec={spec}
        tasks={specTasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          runnerPreference: task.runnerPreference,
        }))}
        prByTaskId={prByTaskId}
        runs={runs
          .filter((run) => run.taskId && specTaskIds.has(run.taskId))
          .map((run) => ({
            id: run.id,
            taskId: run.taskId,
            status: run.status,
            runnerType: run.runnerType,
            createdAt: run.createdAt.toISOString(),
          }))}
        pullRequests={pullRequests
          .filter((pr) => pr.taskId && specTaskIds.has(pr.taskId))
          .map((pr) => ({
            id: pr.id,
            title: pr.title,
            url: pr.url,
            state: pr.state,
            taskId: pr.taskId,
            runId: pr.runId,
          }))}
      />
    )
  })
}
