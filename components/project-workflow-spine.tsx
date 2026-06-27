import Link from "next/link"
import type { ReactNode } from "react"
import { GitPullRequest, ListChecks, Play, ScrollText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { labelize } from "@/lib/labels"

export type WorkflowPlan = {
  title: string
  status: string
  href: string
} | null

export type WorkflowMetric = {
  label: string
  value: number
}

export function ProjectWorkflowSpine({
  projectHref,
  plan,
  specs,
  tasks,
  runs,
  pullRequests,
}: {
  projectHref: string
  plan: WorkflowPlan
  specs: WorkflowMetric[]
  tasks: WorkflowMetric[]
  runs: WorkflowMetric[]
  pullRequests: WorkflowMetric[]
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Workflow</h2>
        <p className="text-xs text-muted-foreground">
          Plan to specs to tasks to runs to PRs
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <WorkflowStep
          icon={<ScrollText className="size-4" />}
          label="Plan"
          href={plan?.href}
          title={plan?.title ?? "No active plan"}
          muted={!plan}
          badge={plan ? labelize(plan.status) : undefined}
        />
        <WorkflowStep
          icon={<ScrollText className="size-4" />}
          label="Specs"
          href={`${projectHref}/specs`}
          title={`${total(specs)} total`}
          metrics={specs}
        />
        <WorkflowStep
          icon={<ListChecks className="size-4" />}
          label="Tasks"
          href={`${projectHref}/tasks`}
          title={`${total(tasks)} total`}
          metrics={tasks}
        />
        <WorkflowStep
          icon={<Play className="size-4" />}
          label="Runs"
          href={`${projectHref}/runs`}
          title={`${total(runs)} total`}
          metrics={runs}
        />
        <WorkflowStep
          icon={<GitPullRequest className="size-4" />}
          label="PRs"
          href={`${projectHref}/pull-requests`}
          title={`${total(pullRequests)} linked`}
          metrics={pullRequests}
        />
      </div>
    </section>
  )
}

function total(metrics: WorkflowMetric[]) {
  return metrics.reduce((sum, metric) => sum + metric.value, 0)
}

function WorkflowStep({
  icon,
  label,
  title,
  href,
  badge,
  metrics = [],
  muted,
}: {
  icon: ReactNode
  label: string
  title: string
  href?: string
  badge?: string
  metrics?: WorkflowMetric[]
  muted?: boolean
}) {
  const content = (
    <div className="h-full space-y-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/60">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        {badge && <Badge variant="outline">{badge}</Badge>}
      </div>
      <p
        className={
          muted ? "text-sm text-muted-foreground" : "text-base font-medium"
        }
      >
        {title}
      </p>
      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metrics
            .filter((metric) => metric.value > 0)
            .slice(0, 4)
            .map((metric) => (
              <Badge key={metric.label} variant="secondary">
                {labelize(metric.label)} {metric.value}
              </Badge>
            ))}
        </div>
      )}
    </div>
  )

  if (!href) return content
  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  )
}
