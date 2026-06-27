import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectCard } from "@/components/project-card"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { ProjectsFilter } from "@/components/projects-filter"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listProjects } from "@/lib/services/projects"
import { listTags } from "@/lib/services/tags"
import { timeAsync } from "@/lib/timing"
import { projectListFiltersSchema } from "@/lib/validation/projects"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return timeAsync("render.projects", async () => {
    const ctx = await requirePrimaryWorkspace()
    const raw = await searchParams
    const filters = projectListFiltersSchema.parse(raw)

    const [projects, tags] = await Promise.all([
      listProjects(ctx.workspaceId, filters),
      listTags(ctx.workspaceId),
    ])

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan, scope, and track agent-ready workspaces.
            </p>
          </div>
          <ProjectFormDialog
            tags={tags}
            trigger={
              <Button>
                <Plus />
                New project
              </Button>
            }
          />
        </div>

        <ProjectsFilter tags={tags} />

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No projects match your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    )
  })
}
