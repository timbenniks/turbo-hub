"use client"

import type * as React from "react"

import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import {
  PROJECT_PRIORITIES,
  RUNNER_PREFERENCES,
  TASK_ASSIGNEE_TYPES,
  TASK_STATUSES,
} from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Task } from "@/lib/services/tasks"

type SpecOption = { id: string; title: string }

/** Drop empty-string values so optional FK/text fields stay unset. */
function clean(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""))
}

export function TaskFormDialog({
  title,
  task,
  specs,
  defaultSpecId,
  parentTaskId,
  trigger,
  onSubmit,
  disabled,
}: {
  title: string
  task?: Task
  specs: SpecOption[]
  defaultSpecId?: string
  parentTaskId?: string
  trigger: React.ReactNode
  onSubmit: (values: Record<string, string>) => Promise<boolean>
  disabled?: boolean
}) {
  const specId = task?.specId ?? defaultSpecId ?? ""

  function handleSubmit(raw: Record<string, string>) {
    const values = clean(raw)
    if (parentTaskId) values.parentTaskId = parentTaskId
    return onSubmit(values)
  }

  return (
    <FormDialog
      title={title}
      trigger={trigger}
      onSubmit={handleSubmit}
      disabled={disabled}
    >
      <Field label="Title" htmlFor="task-title">
        <Input
          id="task-title"
          name="title"
          defaultValue={task?.title}
          required
        />
      </Field>
      <Field label="Description" htmlFor="task-description">
        <Textarea
          id="task-description"
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" htmlFor="task-status">
          <NativeSelect
            id="task-status"
            name="status"
            className="w-full"
            defaultValue={task?.status ?? "backlog"}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Priority" htmlFor="task-priority">
          <NativeSelect
            id="task-priority"
            name="priority"
            className="w-full"
            defaultValue={task?.priority ?? "medium"}
          >
            {PROJECT_PRIORITIES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Assignee" htmlFor="task-assignee">
          <NativeSelect
            id="task-assignee"
            name="assigneeType"
            className="w-full"
            defaultValue={task?.assigneeType ?? "unassigned"}
          >
            {TASK_ASSIGNEE_TYPES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Runner" htmlFor="task-runner">
          <NativeSelect
            id="task-runner"
            name="runnerPreference"
            className="w-full"
            defaultValue={task?.runnerPreference ?? "manual"}
          >
            {RUNNER_PREFERENCES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      {!parentTaskId && (
        <Field label="Related spec" htmlFor="task-spec">
          <NativeSelect
            id="task-spec"
            name="specId"
            className="w-full"
            defaultValue={specId}
          >
            <option value="">None</option>
            {specs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label="Acceptance criteria" htmlFor="task-ac">
        <Textarea
          id="task-ac"
          name="acceptanceCriteria"
          rows={3}
          defaultValue={task?.acceptanceCriteria ?? ""}
        />
      </Field>
    </FormDialog>
  )
}
