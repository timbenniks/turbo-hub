import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listWorkspaceRunsWithProject } from "@/lib/services/runs"
import { labelize } from "@/lib/labels"
import { timeAsync } from "@/lib/timing"

export default async function RunsPage() {
  return timeAsync("render.runs", async () => {
    const ctx = await requirePrimaryWorkspace()
    const runs = await listWorkspaceRunsWithProject(ctx.workspaceId, {
      limit: 50,
    })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
          <p className="text-sm text-muted-foreground">
            Agent runs across all your projects.
          </p>
        </div>

        {runs.length === 0 ? (
          <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            No runs yet. Start one from a task, or have your agent create one
            via MCP.
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
                    {run.taskTitle ?? "No task linked"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {run.projectName ?? "Unknown project"} ·{" "}
                    {labelize(run.runnerType)} ·{" "}
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
