"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { apiSend } from "@/lib/client"
import {
  DECISION_STATUSES,
  DECISION_TYPES,
  type DecisionStatus,
} from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Decision } from "@/lib/services/decisions"

const STATUS_VARIANT: Record<
  DecisionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  proposed: "secondary",
  accepted: "default",
  rejected: "destructive",
  superseded: "outline",
}

export function DecisionsManager({
  projectId,
  decisions,
}: {
  projectId: string
  decisions: Decision[]
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Decisions</h2>
        <DecisionFormDialog
          title="New decision"
          trigger={
            <Button variant="outline">
              <Plus />
              New decision
            </Button>
          }
          disabled={busy}
          onSubmit={(values) =>
            run(
              () =>
                apiSend(`/api/projects/${projectId}/decisions`, "POST", values),
              "Decision recorded"
            )
          }
        />
      </div>

      {decisions.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No decisions yet. Record one, or have your agent add it via MCP.
        </p>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{d.title}</h3>
                  <Badge variant={STATUS_VARIANT[d.status]}>
                    {labelize(d.status)}
                  </Badge>
                  <Badge variant="outline">{labelize(d.type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <NativeSelect
                    value={d.status}
                    disabled={busy}
                    onChange={(e) =>
                      run(
                        () =>
                          apiSend(`/api/decisions/${d.id}`, "PATCH", {
                            status: e.target.value,
                          }),
                        "Decision updated"
                      )
                    }
                  >
                    {DECISION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {labelize(s)}
                      </option>
                    ))}
                  </NativeSelect>
                  <DecisionFormDialog
                    title="Edit decision"
                    decision={d}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    }
                    disabled={busy}
                    onSubmit={(values) =>
                      run(
                        () => apiSend(`/api/decisions/${d.id}`, "PATCH", values),
                        "Decision updated"
                      )
                    }
                  />
                </div>
              </div>
              {d.body && <Markdown>{d.body}</Markdown>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DecisionFormDialog({
  title,
  decision,
  trigger,
  onSubmit,
  disabled,
}: {
  title: string
  decision?: Decision
  trigger: React.ReactNode
  onSubmit: (values: Record<string, string>) => Promise<boolean>
  disabled?: boolean
}) {
  return (
    <FormDialog
      title={title}
      trigger={trigger}
      onSubmit={onSubmit}
      disabled={disabled}
    >
      <Field label="Title" htmlFor="decision-title">
        <Input
          id="decision-title"
          name="title"
          defaultValue={decision?.title}
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" htmlFor="decision-type">
          <NativeSelect
            id="decision-type"
            name="type"
            defaultValue={decision?.type ?? "other"}
            className="w-full"
          >
            {DECISION_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelize(t)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="decision-status">
          <NativeSelect
            id="decision-status"
            name="status"
            defaultValue={decision?.status ?? "proposed"}
            className="w-full"
          >
            {DECISION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Details (Markdown)" htmlFor="decision-body">
        <Textarea
          id="decision-body"
          name="body"
          rows={6}
          defaultValue={decision?.body ?? ""}
          placeholder="What was decided and why; alternatives considered…"
        />
      </Field>
    </FormDialog>
  )
}
