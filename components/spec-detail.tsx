"use client"

import Link from "next/link"
import { ArrowLeft, GitPullRequest, ListChecks, Play } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReadField } from "@/components/ui/field"
import { SpecFormDialog, SPEC_FIELDS } from "@/components/spec-form-dialog"
import { WorkLineage } from "@/components/work-lineage"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import type { Spec } from "@/lib/services/specs"

export function SpecDetail({
  slug,
  project,
  plan,
  spec,
  tasks,
  runs,
  pullRequests,
}: {
  slug: string
  project: { name: string }
  plan: { id: string; title: string; status: string } | null
  spec: Spec
  tasks: { id: string; title: string; status: string; priority: string }[]
  runs: {
    id: string
    taskId: string | null
    status: string
    runnerType: string
    createdAt: string
  }[]
  pullRequests: {
    id: string
    title: string
    url: string | null
    state: string
    taskId: string | null
    runId: string | null
  }[]
}) {
  const { busy, run } = useAsyncAction()
  const taskTitleById = new Map(tasks.map((task) => [task.id, task.title]))

  return (
    <div className="space-y-5">
      <Link
        href={`/projects/${slug}/specs`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All specs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{spec.title}</h2>
            <Badge variant="secondary">{labelize(spec.status)}</Badge>
            <span className="text-xs text-muted-foreground">
              v{spec.version}
            </span>
          </div>
          {spec.summary && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {spec.summary}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <SpecFormDialog
            title="Edit spec"
            spec={spec}
            trigger={
              <Button variant="outline" size="sm">
                Edit
              </Button>
            }
            disabled={busy}
            onSubmit={(values) =>
              run(
                () => apiSend(`/api/specs/${spec.id}`, "PATCH", values),
                "Spec updated"
              )
            }
          />
          {spec.status !== "ready" && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                run(
                  () => apiSend(`/api/specs/${spec.id}/ready`),
                  "Spec marked ready"
                )
              }
            >
              Mark ready
            </Button>
          )}
        </div>
      </div>

      <WorkLineage
        items={[
          {
            label: "Project",
            title: project.name,
            href: `/projects/${slug}`,
          },
          plan
            ? {
                label: "Plan",
                title: plan.title,
                href: `/projects/${slug}/plan`,
                status: labelize(plan.status),
              }
            : { label: "Plan", title: "No linked plan", missing: true },
          {
            label: "Spec",
            title: spec.title,
            status: labelize(spec.status),
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ListChecks className="size-3.5" />
            Tasks
          </p>
          <p className="mt-1 text-sm font-medium">{tasks.length} total</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Play className="size-3.5" />
            Runs
          </p>
          <p className="mt-1 text-sm font-medium">{runs.length} total</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <GitPullRequest className="size-3.5" />
            PRs
          </p>
          <p className="mt-1 text-sm font-medium">
            {pullRequests.length} linked
          </p>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Tasks from this spec
          </h3>
          <Link
            href={`/projects/${slug}/tasks`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all tasks
          </Link>
        </div>
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            No tasks are linked to this spec yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <Link
                  href={`/projects/${slug}/tasks/${task.id}`}
                  className="min-w-0 truncate text-sm font-medium hover:underline"
                >
                  {task.title}
                </Link>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{labelize(task.status)}</Badge>
                  <Badge variant="outline">{labelize(task.priority)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Runs from these tasks
          </h3>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {runs.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <Badge variant="outline">{labelize(item.status)}</Badge>
                  <Link href={`/runs/${item.id}`} className="hover:underline">
                    {labelize(item.runnerType)} run
                  </Link>
                  {item.taskId && (
                    <span className="truncate text-xs text-muted-foreground">
                      {taskTitleById.get(item.taskId)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            PR output
          </h3>
          {pullRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PRs linked yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pullRequests.slice(0, 6).map((pr) => (
                <li key={pr.id} className="flex items-center gap-2">
                  <Badge variant="outline">{labelize(pr.state)}</Badge>
                  {pr.url ? (
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline"
                    >
                      {pr.title}
                    </a>
                  ) : (
                    <span className="truncate">{pr.title}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {SPEC_FIELDS.filter((f) => f.name !== "summary").map((f) => (
          <ReadField
            key={f.name}
            label={f.label}
            value={spec[f.name] as string | null}
          />
        ))}
      </div>
    </div>
  )
}
