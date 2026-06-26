import { TasksManager } from "@/components/tasks-manager"
import { listSpecs } from "@/lib/services/specs"
import { listTasks } from "@/lib/services/tasks"
import { loadProject } from "../project-context"

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { workspaceId, project } = await loadProject(slug)
  const [tasks, specs] = await Promise.all([
    listTasks(workspaceId, project.id),
    listSpecs(workspaceId, project.id),
  ])

  return (
    <TasksManager
      slug={slug}
      projectId={project.id}
      tasks={tasks}
      specs={specs.map((s) => ({ id: s.id, title: s.title }))}
    />
  )
}
