"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/ui/status-chip"
import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { apiSend } from "@/lib/client"
import { DECISION_STATUSES, DECISION_TYPES } from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Decision } from "@/lib/services/decisions"

export function DecisionsManager({
  slug,
  projectName,
  projectId,
  decisions,
}: {
  slug: string
  projectName: string
  projectId: string
  decisions: Decision[]
}) {
  const { busy, run } = useAsyncAction()

  const createDecision = (
    <DecisionFormDialog
      title="New decision"
      trigger={
        <Button variant="outline" size="sm">
          <Plus />
          New decision
        </Button>
      }
      disabled={busy}
      onSubmit={(values) =>
        run(
          () => apiSend(`/api/projects/${projectId}/decisions`, "POST", values),
          "Decision recorded"
        )
      }
    />
  )

  return (
    <div className="space-y-6">
      <CompactProjectHeader
        slug={slug}
        projectName={projectName}
        title="Decisions"
        meta={
          <span>
            {decisions.length === 0
              ? "No decisions yet"
              : `${decisions.length} decision${
                  decisions.length === 1 ? "" : "s"
                }`}
          </span>
        }
        actions={createDecision}
      />

      {decisions.length === 0 ? (
        <HelpfulEmptyState
          title="No decisions yet"
          description="Decisions capture the architecture and trade-off calls behind this project, so agents and teammates don't relitigate them. Record one, or have your agent add it via MCP."
        />
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-[0.9375rem] font-semibold">{d.title}</h3>
                  <StatusChip value={d.status} />
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
