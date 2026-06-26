import { notFound } from "next/navigation"

import { TaskDetail } from "@/components/task-detail"
import { listSpecs } from "@/lib/services/specs"
import { getTask, listDependencies, listTasks } from "@/lib/services/tasks"
import { loadProject } from "../../project-context"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; taskId: string }>
}) {
  const { slug, taskId } = await params
  const { workspaceId, project } = await loadProject(slug)

  const task = await getTask(workspaceId, taskId)
  if (!task || task.projectId !== project.id) notFound()

  const [specs, allTasks, dependencies] = await Promise.all([
    listSpecs(workspaceId, project.id),
    listTasks(workspaceId, project.id),
    listDependencies(workspaceId, taskId),
  ])

  return (
    <TaskDetail
      slug={slug}
      task={task}
      specs={specs.map((s) => ({ id: s.id, title: s.title }))}
      siblings={allTasks.map((t) => ({ id: t.id, title: t.title }))}
      subtasks={allTasks.filter((t) => t.parentTaskId === taskId)}
      dependencies={dependencies}
    />
  )
}
