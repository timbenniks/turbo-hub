import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { labelize } from "@/lib/labels"
import { listPullRequests } from "@/lib/services/pullRequests"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../project-context"

export default async function ProjectPullRequestsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.pull-requests", async () => {
    const { slug } = await params
    const { workspaceId, project } = await loadProject(slug)
    const pullRequests = await listPullRequests(workspaceId, project.id)

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Pull Requests</h2>
          <p className="text-sm text-muted-foreground">
            Pull requests manually linked to this project or its runs.
          </p>
        </div>

        {pullRequests.length === 0 ? (
          <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            No pull requests linked yet. Link one from a run detail page or via
            MCP.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {pullRequests.map((pullRequest) => {
              const content = (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {pullRequest.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pullRequest.provider}
                      {pullRequest.number ? ` #${pullRequest.number}` : ""} ·{" "}
                      {new Date(pullRequest.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {labelize(pullRequest.state)}
                  </Badge>
                </>
              )

              if (pullRequest.runId) {
                return (
                  <Link
                    key={pullRequest.id}
                    href={`/runs/${pullRequest.runId}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    {content}
                  </Link>
                )
              }

              if (pullRequest.url) {
                return (
                  <a
                    key={pullRequest.id}
                    href={pullRequest.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    {content}
                  </a>
                )
              }

              return (
                <div
                  key={pullRequest.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  })
}
