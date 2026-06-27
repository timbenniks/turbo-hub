"use client"

import * as React from "react"
import { ClipboardCopy, ClipboardPaste, Plus } from "lucide-react"
import { toast } from "sonner"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import { Field, ReadField } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { ReadableContent } from "@/components/ui/readable-content"
import { StatusChip } from "@/components/ui/status-chip"
import { Textarea } from "@/components/ui/textarea"
import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import Link from "next/link"
import { apiSend } from "@/lib/client"
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

type SpecRef = {
  id: string
  title: string
  status: string
  planId: string | null
}

export function PlanManager({
  slug,
  projectId,
  project,
  plans,
  specs,
}: {
  slug: string
  projectId: string
  project: PlanContext
  plans: Plan[]
  specs: SpecRef[]
}) {
  const { busy, run } = useAsyncAction()

  const headerActions = (
    <>
      <ExternalPlanDialog
        project={project}
        disabled={busy}
        onSubmit={(values) =>
          run(
            () => apiSend(`/api/projects/${projectId}/plans`, "POST", values),
            "Plan added"
          )
        }
      />
      <PlanFormDialog
        title="New plan"
        trigger={
          <Button variant="outline" size="sm">
            <Plus />
            New plan
          </Button>
        }
        disabled={busy}
        onSubmit={(values) =>
          run(
            () => apiSend(`/api/projects/${projectId}/plans`, "POST", values),
            "Plan created"
          )
        }
      />
    </>
  )

  return (
    <div className="space-y-6">
      <CompactProjectHeader
        slug={slug}
        projectName={project.name}
        title="Plan"
        meta={
          <span>
            {plans.length === 0
              ? "No plans yet"
              : `${plans.length} plan${plans.length === 1 ? "" : "s"}`}
          </span>
        }
        actions={headerActions}
      />

      {plans.length === 0 ? (
        <HelpfulEmptyState
          title="No plans yet"
          description="The plan is the strategic document for this project: what you're building, and what you've agreed not to build. Paste one from your agent, or create one manually."
        />
      ) : (
        <div className="space-y-10">
          {plans.map((plan) => {
            const relatedSpecs = specs.filter((s) => s.planId === plan.id)
            return (
              <div
                key={plan.id}
                className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]"
              >
                {/* Document */}
                <ReadableContent>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {plan.title}
                  </h2>
                  {plan.summary && <Markdown>{plan.summary}</Markdown>}
                  {plan.body && <Markdown>{plan.body}</Markdown>}
                  {PLAN_FIELDS.filter((f) => f.name !== "summary").map((f) => (
                    <ReadField
                      key={f.name}
                      label={f.label}
                      value={plan[f.name]}
                    />
                  ))}
                </ReadableContent>

                {/* Metadata + actions rail */}
                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <StatusChip value={plan.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono text-xs">v{plan.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span className="text-xs">
                        {new Date(plan.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[0.8125rem] font-medium text-muted-foreground">
                      Related specs
                    </p>
                    {relatedSpecs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None yet.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {relatedSpecs.map((s) => (
                          <li key={s.id} className="flex items-center gap-2">
                            <StatusChip value={s.status} />
                            <Link
                              href={`/projects/${slug}/specs/${s.id}`}
                              className="truncate hover:underline"
                            >
                              {s.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      }
                      disabled={busy}
                      onSubmit={(values) =>
                        run(
                          () =>
                            apiSend(`/api/plans/${plan.id}`, "PATCH", values),
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
                </aside>
              </div>
            )
          })}
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
