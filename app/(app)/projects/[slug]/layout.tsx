import { Badge } from "@/components/ui/badge"
import { ProjectActions } from "@/components/project-actions"
import { ProjectTabs } from "@/components/project-tabs"
import { labelize } from "@/lib/labels"
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
    const { project } = await loadProject(slug)

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
          <div className="max-w-4xl space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl leading-tight font-semibold tracking-tight">
                {project.name}
              </h1>
              {project.archivedAt && (
                <Badge variant="destructive">Archived</Badge>
              )}
            </div>
            {project.description && (
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                {project.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{labelize(project.status)}</Badge>
              <Badge variant="outline">
                Health: {labelize(project.health)}
              </Badge>
              <Badge variant="outline">
                Priority: {labelize(project.priority)}
              </Badge>
              <Badge variant="outline">{labelize(project.type)}</Badge>
              {project.tags.map((t) => (
                <Badge key={t.id} variant="outline">
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
          <ProjectActions project={project} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="min-w-0">
            <ProjectTabs slug={slug} />
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    )
  })
}
