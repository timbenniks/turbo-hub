import { ProjectTabs } from "@/components/project-tabs"
import { listProjectRuns } from "@/lib/services/runs"
import { listSpecs } from "@/lib/services/specs"
import { getProjectTaskCounts } from "@/lib/services/tasks"
import { listPullRequests } from "@/lib/services/pullRequests"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "./project-context"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.layout", async () => {
    const { slug } = await params
    const { workspaceId, project } = await loadProject(slug)

    const [specs, taskCounts, runs, prs] = await Promise.all([
      listSpecs(workspaceId, project.id),
      getProjectTaskCounts(workspaceId, project.id),
      listProjectRuns(workspaceId, project.id),
      listPullRequests(workspaceId, project.id),
    ])

    const counts = {
      specs: specs.length,
      tasks: taskCounts.total,
      runs: runs.length,
      prs: prs.length,
    }

    return (
      <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <ProjectTabs slug={slug} counts={counts} />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    )
  })
}
