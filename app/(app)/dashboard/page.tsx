import Link from "next/link"
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/ui/status-chip"
import { ProjectCard } from "@/components/project-card"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { NextActionCard } from "@/components/next-action-card"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { computeNextAction } from "@/lib/next-action"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listRecentProjects } from "@/lib/services/projects"
import { getActivePlan } from "@/lib/services/plans"
import { listPullRequests } from "@/lib/services/pullRequests"
import {
  countActiveRuns,
  listWorkspaceRunsWithProject,
} from "@/lib/services/runs"
import { listSpecs } from "@/lib/services/specs"
import { countTasksByStatus, listTasks } from "@/lib/services/tasks"
import { labelize } from "@/lib/labels"
import { timeAsync } from "@/lib/timing"

function AttentionItem({
  label,
  count,
  href,
  clearText,
}: {
  label: string
  count: number
  href: string
  clearText: string
}) {
  const clear = count === 0
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      {clear ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {clear ? clearText : `${count} ${label}`}
        </p>
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  return timeAsync("render.dashboard", async () => {
    const ctx = await requirePrimaryWorkspace()
    const [recent, blockedTaskCount, needsChangesCount, activeRunCount, runs] =
      await Promise.all([
        listRecentProjects(ctx.workspaceId),
        countTasksByStatus(ctx.workspaceId, "blocked"),
        countTasksByStatus(ctx.workspaceId, "needs_changes"),
        countActiveRuns(ctx.workspaceId),
        listWorkspaceRunsWithProject(ctx.workspaceId, { limit: 50 }),
      ])

    const failedRuns = runs.filter((r) => r.status === "failed").length
    const reviewRuns = runs.filter(
      (r) => r.status === "waiting_for_review"
    ).length
    const recentActivity = runs.slice(0, 6)

    // "Continue working" — derive the next action for the most recent project.
    const top = recent[0] ?? null
    let continueBlock: {
      slug: string
      name: string
      summary: string
      next: ReturnType<typeof computeNextAction>
    } | null = null
    if (top) {
      const [plan, specs, tasks, prs] = await Promise.all([
        getActivePlan(ctx.workspaceId, top.id),
        listSpecs(ctx.workspaceId, top.id),
        listTasks(ctx.workspaceId, top.id),
        listPullRequests(ctx.workspaceId, top.id),
      ])
      const runsForProject = runs.filter((r) => r.projectId === top.id)
      const readyTasks = tasks.filter((t) => t.status === "ready").length
      const next = computeNextAction({
        slug: top.slug,
        plan,
        specs,
        tasks,
        runs: runsForProject,
        pullRequests: prs,
      })
      const summary = `${tasks.length} task${tasks.length === 1 ? "" : "s"}${
        readyTasks > 0 ? ` · ${readyTasks} ready` : ""
      } · ${runsForProject.length} run${
        runsForProject.length === 1 ? "" : "s"
      } · ${prs.length === 0 ? "no PR yet" : `${prs.length} PR${prs.length === 1 ? "" : "s"}`}`
      continueBlock = { slug: top.slug, name: top.name, summary, next }
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              What needs your attention, and what to pick up next.
            </p>
          </div>
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

        {/* Continue working */}
        {continueBlock && (
          <NextActionCard
            eyebrow="Continue working"
            title={continueBlock.name}
            description={`Next: ${continueBlock.next.title}. ${continueBlock.summary}.`}
            actions={[
              {
                label: "Open project",
                href: `/projects/${continueBlock.slug}`,
                primary: true,
              },
              ...continueBlock.next.actions,
            ]}
          />
        )}

        {/* Needs attention */}
        <section className="space-y-3">
          <h2 className="text-[0.8125rem] font-medium text-muted-foreground">
            Needs attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AttentionItem
              label="blocked tasks"
              count={blockedTaskCount}
              href="/projects"
              clearText="No blocked work"
            />
            <AttentionItem
              label="tasks need changes"
              count={needsChangesCount}
              href="/projects"
              clearText="Nothing needs changes"
            />
            <AttentionItem
              label="runs awaiting review"
              count={reviewRuns}
              href="/runs"
              clearText="No runs waiting"
            />
            <AttentionItem
              label="failed runs"
              count={failedRuns}
              href="/runs"
              clearText="No failed runs"
            />
          </div>
        </section>

        {/* Recent projects */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.8125rem] font-medium text-muted-foreground">
              Recent projects
            </h2>
            <Link
              href="/projects"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All projects
            </Link>
          </div>
          {recent.length === 0 ? (
            <HelpfulEmptyState
              title="No projects yet"
              description="A project is the home for a plan, its specs, the tasks that follow, and the runs and PRs that ship it. Create your first one to get started."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>

        {/* Workspace activity */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.8125rem] font-medium text-muted-foreground">
              Workspace activity
            </h2>
            <Link
              href="/runs"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All runs
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs yet. Start one from a task to see activity here.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {recentActivity.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/runs/${r.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {r.taskTitle ?? `${labelize(r.runnerType)} run`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.projectName} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusChip value={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {activeRunCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {activeRunCount} active run{activeRunCount === 1 ? "" : "s"} in
            progress.
          </p>
        )}
      </div>
    )
  })
}
