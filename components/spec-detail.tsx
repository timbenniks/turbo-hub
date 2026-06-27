"use client"

import Link from "next/link"
import { Check, GitPullRequest, X } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import { ReadField } from "@/components/ui/field"
import { ReadableContent } from "@/components/ui/readable-content"
import { StatusChip } from "@/components/ui/status-chip"
import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { SpecFormDialog, SPEC_FIELDS } from "@/components/spec-form-dialog"
import {
  TaskExecutionTable,
  type TaskPr,
} from "@/components/task-execution-table"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import type { Spec } from "@/lib/services/specs"

type SpecTask = {
  id: string
  title: string
  status: string
  priority: string
  runnerPreference: string
}

export function SpecDetail({
  slug,
  project,
  hasRepository,
  plan,
  spec,
  tasks,
  prByTaskId,
  runs,
  pullRequests,
}: {
  slug: string
  project: { name: string }
  hasRepository: boolean
  plan: { id: string; title: string; status: string } | null
  spec: Spec
  tasks: SpecTask[]
  prByTaskId: Record<string, TaskPr>
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
  const readyTasks = tasks.filter((t) => t.status === "ready").length
  const isReady = spec.status === "ready"

  const readinessSummary = [
    readyTasks > 0
      ? `${readyTasks} ready task${readyTasks === 1 ? "" : "s"}`
      : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`,
    `${runs.length} run${runs.length === 1 ? "" : "s"}`,
    pullRequests.length === 0
      ? "no PR yet"
      : `${pullRequests.length} PR${pullRequests.length === 1 ? "" : "s"}`,
  ].join(" · ")

  const checklist = [
    { label: "Summary present", done: Boolean(spec.summary) },
    {
      label: "Acceptance criteria present",
      done: Boolean(spec.acceptanceCriteria),
    },
    { label: "Tasks created", done: tasks.length > 0 },
    { label: "Repository linked", done: hasRepository },
  ]

  const markReady = !isReady && (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() =>
        run(() => apiSend(`/api/specs/${spec.id}/ready`), "Spec marked ready")
      }
    >
      Mark ready
    </Button>
  )

  return (
    <div className="space-y-6">
      <CompactProjectHeader
        slug={slug}
        projectName={project.name}
        crumbs={
          plan
            ? [{ label: plan.title, href: `/projects/${slug}/plan` }]
            : [{ label: "Specs", href: `/projects/${slug}/specs` }]
        }
        title={spec.title}
        meta={
          <>
            <StatusChip value={spec.status} />
            <span className="font-mono text-xs">v{spec.version}</span>
            <span>·</span>
            <span>{readinessSummary}</span>
          </>
        }
        actions={
          <>
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
            {markReady}
          </>
        }
      />

      {spec.summary && (
        <p className="max-w-[820px] text-[0.9375rem] text-muted-foreground">
          {spec.summary}
        </p>
      )}

      {/* Readiness */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[0.9375rem] font-semibold">Readiness</h3>
          {markReady}
        </div>
        <p className="text-sm text-muted-foreground">
          {isReady
            ? "This spec is ready to execute. Dispatch its tasks to runners or pick them up manually."
            : "This spec is still a draft. Work through the checklist, then mark it ready before dispatching tasks."}
        </p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {checklist.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-sm"
            >
              {item.done ? (
                <Check className="size-4 text-success" />
              ) : (
                <X className="size-4 text-muted-foreground/60" />
              )}
              <span
                className={
                  item.done ? "" : "text-muted-foreground"
                }
              >
                {item.label}
                {!item.done && item.label === "Repository linked"
                  ? " — missing"
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tasks from this spec */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[0.8125rem] font-medium text-muted-foreground">
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
          <HelpfulEmptyState
            title="No tasks from this spec yet"
            description="Break this spec into tasks an agent or human can pick up. Each task carries its own acceptance criteria and produces runs and PRs."
          />
        ) : (
          <TaskExecutionTable
            slug={slug}
            tasks={tasks}
            prByTaskId={prByTaskId}
          />
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-[0.8125rem] font-medium text-muted-foreground">
            Runs from these tasks
          </h3>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {runs.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <StatusChip value={item.status} />
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
          <h3 className="text-[0.8125rem] font-medium text-muted-foreground">
            PR output
          </h3>
          {pullRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PRs yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pullRequests.slice(0, 6).map((pr) => (
                <li key={pr.id} className="flex items-center gap-2">
                  <GitPullRequest className="size-4 text-muted-foreground" />
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
                  <StatusChip value={pr.state} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ReadableContent>
        {SPEC_FIELDS.filter((f) => f.name !== "summary").map((f) => (
          <ReadField
            key={f.name}
            label={f.label}
            value={spec[f.name] as string | null}
          />
        ))}
      </ReadableContent>
    </div>
  )
}
