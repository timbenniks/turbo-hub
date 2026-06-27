"use client"

import * as React from "react"
import Link from "next/link"
import { Ban, GitPullRequest, Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import { ReadField } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import { StatusChip } from "@/components/ui/status-chip"
import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import {
  ContextPackPanel,
  type ContextPackView,
} from "@/components/context-pack-panel"
import { TaskFormDialog } from "@/components/task-form-dialog"
import { apiSend } from "@/lib/client"
import { TASK_STATUSES, type TaskStatus } from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Task, TaskDependency } from "@/lib/services/tasks"

type PlanOption = { id: string; title: string; status: string }
type SpecOption = {
  id: string
  title: string
  status: string
  planId: string | null
}
type TaskActivityItem = {
  id: string
  title: string
  type: string
  createdAt: string
}

function RailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  )
}

export function TaskDetail({
  slug,
  project,
  task,
  plans,
  specs,
  siblings,
  subtasks,
  dependencies,
  activity,
  contextPacks,
  runs,
  pullRequests,
  dispatchContextPackId,
}: {
  slug: string
  project: { id: string; name: string }
  task: Task
  plans: PlanOption[]
  specs: SpecOption[]
  siblings: { id: string; title: string }[]
  subtasks: Task[]
  dependencies: TaskDependency[]
  activity: TaskActivityItem[]
  contextPacks: ContextPackView[]
  runs: { id: string; status: string; runnerType: string; createdAt: string }[]
  pullRequests: {
    id: string
    title: string
    url: string | null
    state: string
    runId: string | null
  }[]
  dispatchContextPackId: string | null
}) {
  const { busy, run } = useAsyncAction()
  const [status, setStatus] = React.useOptimistic(task.status)
  const [, startTransition] = React.useTransition()
  const titleById = new Map(siblings.map((s) => [s.id, s.title]))
  const relatedSpec = specs.find((s) => s.id === task.specId)
  const relatedPlan =
    plans.find((p) => p.id === relatedSpec?.planId) ??
    plans.find((p) => p.status === "active")

  async function updateStatus(nextStatus: TaskStatus) {
    const previousStatus = status
    startTransition(() => setStatus(nextStatus))
    const ok = await run(
      () => apiSend(`/api/tasks/${task.id}`, "PATCH", { status: nextStatus }),
      "Status updated",
      { refresh: false }
    )
    if (!ok) {
      startTransition(() => setStatus(previousStatus))
    }
  }

  const latestPr = pullRequests[0]

  return (
    <div className="space-y-6">
      <CompactProjectHeader
        slug={slug}
        projectName={project.name}
        crumbs={[
          { label: "Tasks", href: `/projects/${slug}/tasks` },
          ...(relatedSpec
            ? [
                {
                  label: relatedSpec.title,
                  href: `/projects/${slug}/specs/${relatedSpec.id}`,
                },
              ]
            : []),
        ]}
        title={task.title}
        meta={
          <>
            <StatusChip value={status} />
            <StatusChip value={task.priority} prefix="Priority" />
            <span>{labelize(task.assigneeType)}</span>
          </>
        }
        actions={
          <TaskFormDialog
            title="Edit task"
            task={task}
            specs={specs}
            trigger={
              <Button variant="outline" size="sm">
                Edit
              </Button>
            }
            disabled={busy}
            onSubmit={(values) =>
              run(
                () => apiSend(`/api/tasks/${task.id}`, "PATCH", values),
                "Task updated"
              )
            }
          />
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Main column */}
        <div className="space-y-6">
          {task.description && (
            <div className="space-y-1">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-[0.9375rem] whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <ReadField
            label="Acceptance criteria"
            value={task.acceptanceCriteria}
          />
          <ReadField label="Context notes" value={task.contextNotes} />

          <ContextPackPanel taskId={task.id} packs={contextPacks} />

          {/* Runs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">
                Runs
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      apiSend(`/api/tasks/${task.id}/runs`, "POST", {
                        runnerType: "manual",
                        contextPackId: dispatchContextPackId ?? undefined,
                      }),
                    "Run started"
                  )
                }
              >
                <Plus />
                Start run
              </Button>
            </div>
            {runs.length === 0 ? (
              <HelpfulEmptyState
                title="No runs yet"
                description="A run executes this task and records its timeline and output. Starting one uses the latest approved context pack."
              />
            ) : (
              <ul className="space-y-1 text-sm">
                {runs.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <StatusChip value={r.status} />
                    <Link href={`/runs/${r.id}`} className="hover:underline">
                      {labelize(r.runnerType)} run
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* PR output */}
          <div className="space-y-2">
            <p className="text-[0.8125rem] font-medium text-muted-foreground">
              Pull request output
            </p>
            {pullRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No PRs linked to this task yet.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {pullRequests.map((pr) => (
                  <li
                    key={pr.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <GitPullRequest className="size-4 text-muted-foreground" />
                    {pr.url ? (
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {pr.title}
                      </a>
                    ) : (
                      <span>{pr.title}</span>
                    )}
                    <StatusChip value={pr.state} />
                    {pr.runId && (
                      <Link
                        href={`/runs/${pr.runId}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Run
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dependencies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">
                Dependencies
              </p>
              <AddDependency
                taskId={task.id}
                options={siblings.filter((s) => s.id !== task.id)}
                disabled={busy}
                run={run}
              />
            </div>
            {dependencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {dependencies.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <StatusChip value={d.type} />
                    <span>
                      {titleById.get(d.dependsOnTaskId) ?? d.dependsOnTaskId}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">
                Subtasks
              </p>
              <TaskFormDialog
                title="New subtask"
                specs={specs}
                parentTaskId={task.id}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Plus />
                    Add subtask
                  </Button>
                }
                disabled={busy}
                onSubmit={(values) =>
                  run(
                    () =>
                      apiSend(
                        `/api/projects/${task.projectId}/tasks`,
                        "POST",
                        values
                      ),
                    "Subtask created"
                  )
                }
              />
            </div>
            {subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {subtasks.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <StatusChip value={s.status} />
                    <Link
                      href={`/projects/${slug}/tasks/${s.id}`}
                      className="hover:underline"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <p className="text-[0.8125rem] font-medium text-muted-foreground">
              Activity
            </p>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No task activity yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {activity.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {labelize(event.type)}
                      </p>
                    </div>
                    <time
                      dateTime={event.createdAt}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {new Date(event.createdAt).toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="space-y-1.5">
              <span className="text-muted-foreground">Status</span>
              <NativeSelect
                value={status}
                disabled={busy}
                className="w-full"
                onChange={(e) => updateStatus(e.target.value as TaskStatus)}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelize(s)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <RailRow label="Priority">
              <StatusChip value={task.priority} />
            </RailRow>
            <RailRow label="Runner">
              {labelize(task.runnerPreference)}
            </RailRow>
            <RailRow label="Assignee">{labelize(task.assigneeType)}</RailRow>
            <RailRow label="Branch">
              {task.branchName ? (
                <span className="font-mono text-xs">{task.branchName}</span>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </RailRow>
            <RailRow label="PR">
              {latestPr ? (
                <StatusChip value={latestPr.state} />
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </RailRow>
          </div>

          <div className="space-y-2">
            <p className="text-[0.8125rem] font-medium text-muted-foreground">
              Source
            </p>
            <div className="rounded-xl border border-border p-3 text-sm">
              {relatedSpec ? (
                <Link
                  href={`/projects/${slug}/specs/${relatedSpec.id}`}
                  className="hover:underline"
                >
                  {relatedSpec.title}
                </Link>
              ) : (
                <span className="text-muted-foreground">No spec linked</span>
              )}
              {relatedPlan && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Plan: {relatedPlan.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy || status === "done"}
              onClick={() => updateStatus("done")}
            >
              Mark done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || status === "blocked"}
              onClick={() => updateStatus("blocked")}
            >
              <Ban />
              Mark blocked
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function AddDependency({
  taskId,
  options,
  disabled,
  run,
}: {
  taskId: string
  options: { id: string; title: string }[]
  disabled?: boolean
  run: (fn: () => Promise<unknown>, msg: string) => Promise<boolean>
}) {
  const [value, setValue] = React.useState("")
  if (options.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <NativeSelect
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-48"
      >
        <option value="">Add dependency…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </NativeSelect>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || !value}
        onClick={async () => {
          const ok = await run(
            () =>
              apiSend(`/api/tasks/${taskId}/dependencies`, "POST", {
                dependsOnTaskId: value,
                type: "blocks",
              }),
            "Dependency added"
          )
          if (ok) setValue("")
        }}
      >
        Add
      </Button>
    </div>
  )
}
