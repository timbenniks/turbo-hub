import { notFound } from "next/navigation"

import { TaskDetail } from "@/components/task-detail"
import { listTaskActivity } from "@/lib/services/activity"
import { listContextPacks } from "@/lib/services/contextPacks"
import { listTaskRuns } from "@/lib/services/runs"
import { listSpecs } from "@/lib/services/specs"
import { getTask, listDependencies, listTasks } from "@/lib/services/tasks"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../../project-context"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; taskId: string }>
}) {
  return timeAsync("render.project.task-detail", async () => {
  const { slug, taskId } = await params
  const { workspaceId, project } = await loadProject(slug)

  const task = await getTask(workspaceId, taskId)
  if (!task || task.projectId !== project.id) notFound()

  const [specs, allTasks, dependencies, activity, contextPacks, runs] =
    await Promise.all([
      listSpecs(workspaceId, project.id),
      listTasks(workspaceId, project.id),
      listDependencies(workspaceId, taskId),
      listTaskActivity(workspaceId, taskId),
      listContextPacks(workspaceId, taskId),
      listTaskRuns(workspaceId, taskId),
    ])

  // Prefer a frozen (sent) pack, then an approved one, to ground a new run.
  const dispatchPack =
    contextPacks.find((p) => p.status === "sent") ??
    contextPacks.find((p) => p.status === "approved") ??
    null

  return (
    <TaskDetail
      slug={slug}
      task={task}
      specs={specs.map((s) => ({ id: s.id, title: s.title }))}
      siblings={allTasks.map((t) => ({ id: t.id, title: t.title }))}
      subtasks={allTasks.filter((t) => t.parentTaskId === taskId)}
      dependencies={dependencies}
      activity={activity.map((event) => ({
        id: event.id,
        title: event.title,
        type: event.type,
        createdAt: event.createdAt.toISOString(),
      }))}
      contextPacks={contextPacks.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        tokenEstimate: p.tokenEstimate,
        body: p.body,
      }))}
      runs={runs.map((r) => ({
        id: r.id,
        status: r.status,
        runnerType: r.runnerType,
        createdAt: r.createdAt.toISOString(),
      }))}
      dispatchContextPackId={dispatchPack?.id ?? null}
    />
  )
  })
}
