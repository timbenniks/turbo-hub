import Link from "next/link"

import { ProjectActions } from "@/components/project-actions"
import { ProjectRepositoryPanel } from "@/components/project-repository-panel"
import { NextActionCard } from "@/components/next-action-card"
import { WorkflowRail, type RailStep } from "@/components/workflow-rail"
import { Badge } from "@/components/ui/badge"
import { StatusChip } from "@/components/ui/status-chip"
import { listDecisions } from "@/lib/services/decisions"
import { listLearnings } from "@/lib/services/learnings"
import { getActivePlan } from "@/lib/services/plans"
import { listPullRequests } from "@/lib/services/pullRequests"
import { getRepository } from "@/lib/services/repositories"
import { listProjectRuns } from "@/lib/services/runs"
import { listSpecs } from "@/lib/services/specs"
import { getProjectTaskCounts, listTasks } from "@/lib/services/tasks"
import { computeNextAction } from "@/lib/next-action"
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

function SideHeading({
  children,
  href,
  linkLabel,
}: {
  children: React.ReactNode
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[0.8125rem] font-medium text-muted-foreground">
        {children}
      </h3>
      {href && (
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {linkLabel ?? "View all"}
        </Link>
      )}
    </div>
  )
}

// Pick the spec the user is most likely working on next.
function activeSpec<T extends { status: string }>(specs: T[]): T | null {
  return (
    specs.find((s) => s.status === "in_progress") ??
    specs.find((s) => s.status === "ready") ??
    specs.find((s) => s.status === "draft") ??
    specs[0] ??
    null
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
    const [
      activePlan,
      taskCounts,
      decisions,
      learnings,
      repository,
      specs,
      tasks,
      runs,
      pullRequests,
    ] = await Promise.all([
      getActivePlan(workspaceId, project.id),
      getProjectTaskCounts(workspaceId, project.id),
      listDecisions(workspaceId, project.id),
      listLearnings(workspaceId, project.id),
      project.repositoryId
        ? getRepository(workspaceId, project.repositoryId)
        : Promise.resolve(null),
      listSpecs(workspaceId, project.id),
      listTasks(workspaceId, project.id),
      listProjectRuns(workspaceId, project.id),
      listPullRequests(workspaceId, project.id),
    ])
    const recentDecisions = decisions.slice(0, 5)
    const recentLearnings = learnings.slice(0, 5)
    const recentRuns = runs.slice(0, 5)
    const spec = activeSpec(specs)
    const readyTasks = tasks.filter((t) => t.status === "ready").length

    const nextAction = computeNextAction({
      slug,
      plan: activePlan,
      specs,
      tasks,
      runs,
      pullRequests,
    })

    const draftSpec = specs.find((s) => s.status === "draft")
    const blockedTask = tasks.find((t) => t.status === "blocked")
    const steps: RailStep[] = [
      {
        key: "plan",
        label: "Plan",
        href: `/projects/${slug}/plan`,
        summary: activePlan ? activePlan.title : "No plan yet",
        chip: activePlan?.status ?? null,
        muted: !activePlan,
      },
      {
        key: "specs",
        label: "Specs",
        href: `/projects/${slug}/specs`,
        summary:
          specs.length === 0
            ? "No specs yet"
            : `${specs.length} spec${specs.length === 1 ? "" : "s"}`,
        chip: draftSpec?.status ?? spec?.status ?? null,
        muted: specs.length === 0,
      },
      {
        key: "tasks",
        label: "Tasks",
        href: `/projects/${slug}/tasks`,
        summary:
          tasks.length === 0
            ? "No tasks yet"
            : readyTasks > 0
              ? `${readyTasks} ready`
              : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`,
        chip: blockedTask
          ? "blocked"
          : readyTasks > 0
            ? "ready"
            : (tasks[0]?.status ?? null),
        muted: tasks.length === 0,
      },
      {
        key: "runs",
        label: "Runs",
        href: `/projects/${slug}/runs`,
        summary:
          runs.length === 0
            ? "No runs yet"
            : `${runs.length} run${runs.length === 1 ? "" : "s"}`,
        chip: runs[0]?.status ?? null,
        muted: runs.length === 0,
      },
      {
        key: "prs",
        label: "PRs",
        href: `/projects/${slug}/pull-requests`,
        summary:
          pullRequests.length === 0
            ? "No PRs yet"
            : `${pullRequests.length} PR${pullRequests.length === 1 ? "" : "s"}`,
        chip: pullRequests[0]?.state ?? null,
        muted: pullRequests.length === 0,
      },
    ]

    return (
      <div className="space-y-8">
        {/* Hero */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              {project.archivedAt && (
                <Badge variant="destructive">Archived</Badge>
              )}
            </div>
            {project.description && (
              <p className="text-[0.9375rem] leading-7 text-muted-foreground">
                {project.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip value={project.status} />
              <StatusChip value={project.health} prefix="Health" />
              <StatusChip value={project.priority} prefix="Priority" />
              <Badge variant="outline">{labelize(project.type)}</Badge>
              {project.tags.map((t) => (
                <Badge key={t.id} variant="outline">
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
          <ProjectActions project={project} />
        </div>

        <NextActionCard {...nextAction} />

        <WorkflowRail steps={steps} />

        {/* Body: workflow main column + metadata side rail */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-6">
            <Field label="Current goal" value={project.goal} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Current plan</p>
                <p className="mt-1 truncate text-sm font-medium">
                  {activePlan ? (
                    <Link
                      href={`/projects/${slug}/plan`}
                      className="hover:underline"
                    >
                      {activePlan.title}
                    </Link>
                  ) : (
                    "None yet"
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Active spec</p>
                <p className="mt-1 truncate text-sm font-medium">
                  {spec ? (
                    <Link
                      href={`/projects/${slug}/specs/${spec.id}`}
                      className="hover:underline"
                    >
                      {spec.title}
                    </Link>
                  ) : (
                    "None yet"
                  )}
                </p>
              </div>
            </div>

            <div>
              <SideHeading href={`/projects/${slug}/tasks`}>
                Open tasks
              </SideHeading>
              <p className="mt-2 text-sm text-muted-foreground">
                {taskCounts.open === 0
                  ? "No open tasks."
                  : `${taskCounts.open} open of ${taskCounts.total} total${
                      readyTasks > 0 ? ` · ${readyTasks} ready` : ""
                    }.`}
              </p>
            </div>

            <div className="space-y-2">
              <SideHeading href={`/projects/${slug}/runs`}>
                Recent runs
              </SideHeading>
              {recentRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No runs yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {recentRuns.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/runs/${r.id}`}
                        className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="truncate">
                          {labelize(r.runnerType)} run
                        </span>
                        <StatusChip value={r.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Side rail */}
          <aside className="space-y-6">
            <div id="repository" className="scroll-mt-24">
              <ProjectRepositoryPanel
                projectId={project.id}
                repository={repository}
              />
            </div>

            <div className="space-y-2">
              <SideHeading href={`/projects/${slug}/decisions`}>
                Recent decisions
              </SideHeading>
              {recentDecisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {recentDecisions.map((d) => (
                    <li key={d.id} className="flex items-center gap-2">
                      <StatusChip value={d.status} />
                      <span className="truncate">{d.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <SideHeading href={`/projects/${slug}/learnings`}>
                Recent learnings
              </SideHeading>
              {recentLearnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {recentLearnings.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      <StatusChip value={l.type} />
                      <span className="truncate">{l.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(project.constraints ||
              project.stack.length > 0 ||
              project.notes) && (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <h3 className="text-[0.8125rem] font-medium text-muted-foreground">
                  Project metadata
                </h3>
                <dl className="space-y-3">
                  <Field label="Constraints" value={project.constraints} />
                  <Field
                    label="Stack"
                    value={
                      project.stack.length ? project.stack.join(", ") : null
                    }
                  />
                  <Field label="Notes" value={project.notes} />
                </dl>
              </div>
            )}
          </aside>
        </div>
      </div>
    )
  })
}
