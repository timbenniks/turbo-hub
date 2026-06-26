import Link from "next/link"

import { getActivePlan } from "@/lib/services/plans"
import { listTasks } from "@/lib/services/tasks"
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
  const { slug } = await params
  const { workspaceId, project } = await loadProject(slug)
  const [activePlan, openTasks] = await Promise.all([
    getActivePlan(workspaceId, project.id),
    listTasks(workspaceId, project.id),
  ])
  const openCount = openTasks.filter(
    (t) => t.status !== "done" && t.status !== "canceled"
  ).length

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
          <p className="text-sm font-medium">{openCount}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total tasks</p>
          <p className="text-sm font-medium">{openTasks.length}</p>
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
    </div>
  )
}
