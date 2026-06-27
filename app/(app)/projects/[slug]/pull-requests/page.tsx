import Link from "next/link"

import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { StatusChip } from "@/components/ui/status-chip"
import { listPullRequestsWithRepository } from "@/lib/services/pullRequests"
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
    const pullRequests = await listPullRequestsWithRepository(
      workspaceId,
      project.id
    )

    return (
      <div className="space-y-6">
        <CompactProjectHeader
          slug={slug}
          projectName={project.name}
          title="PRs"
          meta={
            <span>
              {pullRequests.length === 0
                ? "No PRs yet"
                : `${pullRequests.length} PR${
                    pullRequests.length === 1 ? "" : "s"
                  }`}
            </span>
          }
        />

        {pullRequests.length === 0 ? (
          <HelpfulEmptyState
            title="No PRs yet"
            description="Linked PRs let you track the code a run produced — review state, branch, and merge status — without leaving the hub. Link one from a run detail page or via MCP."
          />
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
                      {pullRequest.repository?.fullName ?? pullRequest.provider}
                      {pullRequest.number
                        ? ` #${pullRequest.number}`
                        : ""} ·{" "}
                      {new Date(pullRequest.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusChip value={pullRequest.state} />
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
