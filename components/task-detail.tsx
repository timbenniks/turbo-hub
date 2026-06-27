"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

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
import { apiSend } from "@/lib/client"
import { TASK_STATUSES, type TaskStatus } from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Task, TaskDependency } from "@/lib/services/tasks"

type SpecOption = { id: string; title: string }
type TaskActivityItem = {
  id: string
  title: string
  type: string
  createdAt: string
}

export function TaskDetail({
  slug,
  task,
  specs,
  siblings,
  subtasks,
  dependencies,
  activity,
  contextPacks,
  runs,
  dispatchContextPackId,
}: {
  slug: string
  task: Task
  specs: SpecOption[]
  siblings: { id: string; title: string }[]
  subtasks: Task[]
  dependencies: TaskDependency[]
  activity: TaskActivityItem[]
  contextPacks: ContextPackView[]
  runs: { id: string; status: string; runnerType: string; createdAt: string }[]
  dispatchContextPackId: string | null
}) {
  const { busy, run } = useAsyncAction()
  const [status, setStatus] = React.useOptimistic(task.status)
  const [, startTransition] = React.useTransition()
  const titleById = new Map(siblings.map((s) => [s.id, s.title]))
  const relatedSpec = specs.find((s) => s.id === task.specId)

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

      {task.description && (
        <p className="text-sm whitespace-pre-wrap">{task.description}</p>
      )}

      <ReadField label="Acceptance criteria" value={task.acceptanceCriteria} />

      {relatedSpec && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Related spec
          </p>
          <Link
            href={`/projects/${slug}/specs/${relatedSpec.id}`}
            className="text-sm hover:underline"
          >
            {relatedSpec.title}
          </Link>
        </div>
      )}

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
