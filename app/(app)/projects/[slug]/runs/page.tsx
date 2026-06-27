import Link from "next/link"

import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { StatusChip } from "@/components/ui/status-chip"
import { labelize } from "@/lib/labels"
import { listProjectRuns } from "@/lib/services/runs"
import { listTasks } from "@/lib/services/tasks"
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
    const [runs, tasks] = await Promise.all([
      listProjectRuns(workspaceId, project.id),
      listTasks(workspaceId, project.id),
    ])
    const taskTitleById = new Map(tasks.map((task) => [task.id, task.title]))

    return (
      <div className="space-y-6">
        <CompactProjectHeader
          slug={slug}
          projectName={project.name}
          title="Runs"
          meta={
            <span>
              {runs.length === 0
                ? "No runs yet"
                : `${runs.length} run${runs.length === 1 ? "" : "s"}`}
            </span>
          }
        />

        {runs.length === 0 ? (
          <HelpfulEmptyState
            title="No runs yet"
            description="A run is one execution attempt against a task — it records the timeline, output, and resulting PR. Start one from a task, or have an agent create one via MCP."
          />
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
                    {run.taskId
                      ? (taskTitleById.get(run.taskId) ?? "Unknown task")
                      : "No task linked"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labelize(run.runnerType)} ·{" "}
                    {new Date(run.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusChip value={run.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  })
}
