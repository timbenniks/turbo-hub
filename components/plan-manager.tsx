"use client"

import * as React from "react"
import { ClipboardCopy, ClipboardPaste, Plus } from "lucide-react"
import { toast } from "sonner"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, ReadField } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { Textarea } from "@/components/ui/textarea"
import { PromptDialog } from "@/components/prompt-dialog"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import {
  buildExternalPlanPrompt,
  parsePlanMarkdown,
  type PlanContext,
} from "@/lib/plan-import"
import type { Plan } from "@/lib/services/plans"

const PLAN_FIELDS = [
  { name: "summary", label: "Summary" },
  { name: "goals", label: "Goals" },
  { name: "nonGoals", label: "Non-goals" },
  { name: "constraints", label: "Constraints" },
  { name: "milestones", label: "Milestones" },
  { name: "openQuestions", label: "Open questions" },
] as const

export function PlanManager({
  projectId,
  project,
  plans,
}: {
  projectId: string
  project: PlanContext
  plans: Plan[]
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Plans</h2>
        <div className="flex gap-2">
          <PromptDialog
            triggerLabel="Generate plan"
            title="Generate a plan"
            description="Describe what you want to build. The draft is editable before you activate it."
            placeholder="e.g. A CLI that syncs my notes to a Postgres database…"
            rows={6}
            disabled={busy}
            onSubmit={(idea) =>
              run(
                () =>
                  apiSend(`/api/projects/${projectId}/plans/generate`, "POST", {
                    idea,
                  }),
                "Plan generated"
              )
            }
          />
          <ExternalPlanDialog
            project={project}
            disabled={busy}
            onSubmit={(values) =>
              run(
                () =>
                  apiSend(`/api/projects/${projectId}/plans`, "POST", values),
                "Plan added"
              )
            }
          />
          <PlanFormDialog
            title="New plan"
            trigger={
              <Button variant="outline">
                <Plus />
                New plan
              </Button>
            }
            disabled={busy}
            onSubmit={(values) =>
              run(
                () =>
                  apiSend(`/api/projects/${projectId}/plans`, "POST", values),
                "Plan created"
              )
            }
          />
        </div>
      </div>

      {plans.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No plans yet. Generate one from an idea, or create one manually.
        </p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{plan.title}</h3>
                  <Badge
                    variant={plan.status === "active" ? "default" : "secondary"}
                  >
                    {labelize(plan.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    v{plan.version}
                  </span>
                </div>
                <div className="flex gap-2">
                  {plan.status !== "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => apiSend(`/api/plans/${plan.id}/activate`),
                          "Plan activated"
                        )
                      }
                    >
                      Mark active
                    </Button>
                  )}
                  <PlanFormDialog
                    title="Edit plan"
                    plan={plan}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    }
                    disabled={busy}
                    onSubmit={(values) =>
                      run(
                        () => apiSend(`/api/plans/${plan.id}`, "PATCH", values),
                        "Plan updated"
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !confirm(
                          `Delete plan "${plan.title}"? This can't be undone.`
                        )
                      )
                        return
                      run(
                        () => apiSend(`/api/plans/${plan.id}`, "DELETE"),
                        "Plan deleted"
                      )
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {plan.summary && <Markdown>{plan.summary}</Markdown>}
              {plan.body && <Markdown>{plan.body}</Markdown>}
              <div className="grid gap-4 sm:grid-cols-2">
                {PLAN_FIELDS.filter((f) => f.name !== "summary").map((f) => (
                  <ReadField
                    key={f.name}
                    label={f.label}
                    value={plan[f.name]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlanFormDialog({
  title,
  plan,
  trigger,
  onSubmit,
  disabled,
}: {
  title: string
  plan?: Plan
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
      <Field label="Title" htmlFor="plan-title">
        <Input
          id="plan-title"
          name="title"
          defaultValue={plan?.title}
          required
        />
      </Field>
      <Field label="Plan (Markdown)" htmlFor="plan-body">
        <Textarea
          id="plan-body"
          name="body"
          rows={10}
          defaultValue={plan?.body ?? ""}
          placeholder="Full plan body — used for pasted plans. Leave empty to use the structured fields below."
        />
      </Field>
      {PLAN_FIELDS.map((f) => (
        <Field key={f.name} label={f.label} htmlFor={`plan-${f.name}`}>
          <Textarea
            id={`plan-${f.name}`}
            name={f.name}
            rows={3}
            defaultValue={plan?.[f.name] ?? ""}
          />
        </Field>
      ))}
    </FormDialog>
  )
}

/**
 * Plan with an external agent: copy a project-aware prompt, paste the agent's
 * labeled-Markdown reply, and parse it into structured fields. Falls back to a
 * raw Markdown body if no known headings are found, so a paste is never lost.
 */
function ExternalPlanDialog({
  project,
  onSubmit,
  disabled,
}: {
  project: PlanContext
  onSubmit: (values: Record<string, string>) => Promise<boolean>
  disabled?: boolean
}) {
  async function copyPrompt() {
    const prompt = buildExternalPlanPrompt(project)
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied — paste it into your agent")
    } catch {
      toast.error("Couldn't access the clipboard")
    }
  }

  function handleSubmit(values: Record<string, string>) {
    const { title, paste } = values
    const parsed = parsePlanMarkdown(paste ?? "")
    return onSubmit({ title, ...parsed })
  }

  return (
    <FormDialog
      title="Plan with an external agent"
      submitLabel="Add plan"
      trigger={
        <Button variant="outline">
          <ClipboardPaste />
          Paste plan
        </Button>
      }
      onSubmit={handleSubmit}
      disabled={disabled}
    >
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">
          Copy a project-aware prompt, run it in your agent, then paste the
          Markdown reply below.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={copyPrompt}>
          <ClipboardCopy />
          Copy prompt
        </Button>
      </div>
      <Field label="Title" htmlFor="paste-title">
        <Input
          id="paste-title"
          name="title"
          placeholder="Plan title"
          required
        />
      </Field>
      <Field label="Agent output (Markdown)" htmlFor="paste-body">
        <Textarea
          id="paste-body"
          name="paste"
          rows={14}
          placeholder="Paste the agent's plan here. Recognized headings (Summary, Goals, Non-goals, Constraints, Milestones, Open questions) become structured fields…"
          required
        />
      </Field>
    </FormDialog>
  )
}
