import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { listDecisions } from "@/lib/services/decisions"
import { listLearnings } from "@/lib/services/learnings"
import { getActivePlan } from "@/lib/services/plans"
import { getProjectTaskCounts } from "@/lib/services/tasks"
import { labelize } from "@/lib/labels"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "./project-context"

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  )
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.overview", async () => {
  const { slug } = await params
  const { workspaceId, project } = await loadProject(slug)
  const [activePlan, taskCounts, decisions, learnings] = await Promise.all([
    getActivePlan(workspaceId, project.id),
    getProjectTaskCounts(workspaceId, project.id),
    listDecisions(workspaceId, project.id),
    listLearnings(workspaceId, project.id),
  ])
  const recentDecisions = decisions.slice(0, 5)
  const recentLearnings = learnings.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Active plan</p>
          <p className="truncate text-sm font-medium">
            {activePlan ? (
              <Link href={`/projects/${slug}/plan`} className="hover:underline">
                {activePlan.title}
              </Link>
            ) : (
              "None yet"
            )}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Open tasks</p>
          <p className="text-sm font-medium">{taskCounts.open}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total tasks</p>
          <p className="text-sm font-medium">{taskCounts.total}</p>
        </div>
      </div>

      <dl className="grid gap-5 sm:grid-cols-2">
        <Field label="Goal" value={project.goal} />
        <Field label="Constraints" value={project.constraints} />
        <Field
          label="Stack"
          value={project.stack.length ? project.stack.join(", ") : null}
        />
        <Field label="Notes" value={project.notes} />
      </dl>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Recent decisions
            </p>
            <Link
              href={`/projects/${slug}/decisions`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {recentDecisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentDecisions.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <Badge variant="outline">{labelize(d.status)}</Badge>
                  <span className="truncate">{d.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Recent learnings
            </p>
            <Link
              href={`/projects/${slug}/learnings`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {recentLearnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentLearnings.map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <Badge variant="secondary">{labelize(l.type)}</Badge>
                  <span className="truncate">{l.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
  })
}
