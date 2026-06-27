"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, GitPullRequest, Play, Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReadField } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import {
  ContextPackPanel,
  type ContextPackView,
} from "@/components/context-pack-panel"
import { TaskFormDialog } from "@/components/task-form-dialog"
import { WorkLineage } from "@/components/work-lineage"
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
      () =>
        apiSend(`/api/tasks/${task.id}`, "PATCH", {
          status: nextStatus,
        }),
      "Status updated",
      { refresh: false }
    )
    if (!ok) {
      startTransition(() => setStatus(previousStatus))
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/projects/${slug}/tasks`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All tasks
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{task.title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{labelize(task.priority)}</Badge>
            <Badge variant="secondary">{labelize(task.assigneeType)}</Badge>
            <Badge variant="outline">{labelize(task.runnerPreference)}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect
            value={status}
            disabled={busy}
            onChange={(e) => updateStatus(e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </NativeSelect>
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
        </div>
      </div>

      <WorkLineage
        items={[
          {
            label: "Project",
            title: project.name,
            href: `/projects/${slug}`,
          },
          relatedPlan
            ? {
                label: "Plan",
                title: relatedPlan.title,
                href: `/projects/${slug}/plan`,
                status: labelize(relatedPlan.status),
              }
            : {
                label: "Plan",
                title: "No linked plan",
                missing: true,
              },
          relatedSpec
            ? {
                label: "Spec",
                title: relatedSpec.title,
                href: `/projects/${slug}/specs/${relatedSpec.id}`,
                status: labelize(relatedSpec.status),
              }
            : {
                label: "Spec",
                title: "No linked spec",
                missing: true,
              },
          {
            label: "Task",
            title: task.title,
            status: labelize(status),
          },
        ]}
      />

      {task.description && (
        <p className="text-sm whitespace-pre-wrap">{task.description}</p>
      )}

      <ReadField label="Acceptance criteria" value={task.acceptanceCriteria} />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Source</p>
          <p className="mt-1 text-sm">
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
          </p>
          {relatedPlan && (
            <p className="mt-1 text-xs text-muted-foreground">
              Plan: {relatedPlan.title}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Execution</p>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <Play className="size-3.5 text-muted-foreground" />
            {runs.length} run{runs.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {contextPacks.length} context pack
            {contextPacks.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Output</p>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <GitPullRequest className="size-3.5 text-muted-foreground" />
            {pullRequests.length} linked PR
            {pullRequests.length === 1 ? "" : "s"}
          </p>
          {pullRequests[0] && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Latest: {pullRequests[0].title}
            </p>
          )}
        </div>
      </div>

      <ContextPackPanel taskId={task.id} packs={contextPacks} />

      {/* Runs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Runs</p>
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
          <p className="text-sm text-muted-foreground">
            No runs yet. Start one (uses the latest approved context pack).
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <Badge variant="outline">{labelize(r.status)}</Badge>
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

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
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
                <Badge variant="outline">{labelize(pr.state)}</Badge>
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
          <p className="text-xs font-medium text-muted-foreground">
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
                <Badge variant="outline">{labelize(d.type)}</Badge>
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
          <p className="text-xs font-medium text-muted-foreground">Subtasks</p>
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
              <li key={s.id}>
                <Link
                  href={`/projects/${slug}/tasks/${s.id}`}
                  className="hover:underline"
                >
                  {s.title}
                </Link>{" "}
                <span className="text-xs text-muted-foreground">
                  {labelize(s.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Activity</p>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No task activity yet.</p>
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
