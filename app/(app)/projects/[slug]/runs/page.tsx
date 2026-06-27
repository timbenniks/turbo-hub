import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { labelize } from "@/lib/labels"
import { listProjectRuns } from "@/lib/services/runs"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../project-context"

export default async function ProjectRunsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.runs", async () => {
    const { slug } = await params
    const { workspaceId, project } = await loadProject(slug)
    const runs = await listProjectRuns(workspaceId, project.id)

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Runs</h2>
          <p className="text-sm text-muted-foreground">
            Agent runs linked to this project.
          </p>
        </div>

        {runs.length === 0 ? (
          <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            No runs yet. Start one from a task, or have an agent create one via
            MCP.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {labelize(run.runnerType)} run
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(run.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">{labelize(run.status)}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  })
}
