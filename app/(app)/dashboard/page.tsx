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
import Link from "next/link"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listRecentProjects } from "@/lib/services/projects"
import { countActiveRuns } from "@/lib/services/runs"
import { countTasksByStatus } from "@/lib/services/tasks"
import { timeAsync } from "@/lib/timing"

export default async function DashboardPage() {
  return timeAsync("render.dashboard", async () => {
  const ctx = await requirePrimaryWorkspace()
  const [recent, blockedTaskCount, activeRunCount] = await Promise.all([
    listRecentProjects(ctx.workspaceId),
    countTasksByStatus(ctx.workspaceId, "blocked"),
    countActiveRuns(ctx.workspaceId),
  ])

  const placeholders = [
    { title: "Open pull requests", hint: "Linked PRs appear here (Phase 5)." },
    { title: "Patterns", hint: "Reusable patterns library (Phase 2)." },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <ProjectFormDialog
          tags={[]}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Blocked tasks</CardTitle>
            <CardDescription className="text-xs">
              {blockedTaskCount === 0
                ? "No blocked work right now."
                : `${blockedTaskCount} task${
                    blockedTaskCount === 1 ? "" : "s"
                  } blocked.`}
            </CardDescription>
          </CardHeader>
        </Card>
        <Link href="/runs">
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="text-sm">Active runs</CardTitle>
              <CardDescription className="text-xs">
                {activeRunCount === 0
                  ? "No active runs."
                  : `${activeRunCount} run${
                      activeRunCount === 1 ? "" : "s"
                    } in progress.`}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
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
  })
}
