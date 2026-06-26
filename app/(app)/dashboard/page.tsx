import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProjectCard } from "@/components/project-card"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listProjects } from "@/lib/services/projects"
import { listTags } from "@/lib/services/tags"

export default async function DashboardPage() {
  const ctx = await requirePrimaryWorkspace()
  const [projects, tags] = await Promise.all([
    listProjects(ctx.workspaceId, { includeArchived: false }),
    listTags(ctx.workspaceId),
  ])
  const recent = projects.slice(0, 6)

  const placeholders = [
    { title: "Active runs", hint: "Agent runs appear here (Phase 3)." },
    { title: "Open pull requests", hint: "Linked PRs appear here (Phase 3+)." },
    { title: "Blocked tasks", hint: "Blocked work appears here (Phase 1)." },
    {
      title: "Recent learnings",
      hint: "Captured learnings appear here (Phase 2).",
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
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

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Recent projects
        </h2>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No projects yet. Create your first one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-sm">{p.title}</CardTitle>
              <CardDescription className="text-xs">{p.hint}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  )
}
