"use client"

import type * as React from "react"

import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Spec } from "@/lib/services/specs"

export const SPEC_FIELDS = [
  { name: "summary", label: "Summary" },
  { name: "problem", label: "Problem" },
  { name: "goal", label: "Goal" },
  { name: "scope", label: "Scope" },
  { name: "nonGoals", label: "Non-goals" },
  { name: "userStories", label: "User stories" },
  { name: "uxRequirements", label: "UX requirements" },
  { name: "dataRequirements", label: "Data requirements" },
  { name: "apiRequirements", label: "API requirements" },
  { name: "acceptanceCriteria", label: "Acceptance criteria" },
  { name: "risks", label: "Risks" },
  { name: "implementationNotes", label: "Implementation notes" },
] as const satisfies readonly { name: keyof Spec; label: string }[]

export function SpecFormDialog({
  title,
  spec,
  trigger,
  onSubmit,
  disabled,
}: {
  title: string
  spec?: Spec
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
      contentClassName="max-h-[90svh] overflow-y-auto sm:max-w-xl"
    >
      <Field label="Title" htmlFor="spec-title">
        <Input
          id="spec-title"
          name="title"
          defaultValue={spec?.title}
          required
        />
      </Field>
      {SPEC_FIELDS.map((f) => (
        <Field key={f.name} label={f.label} htmlFor={`spec-${f.name}`}>
          <Textarea
            id={`spec-${f.name}`}
            name={f.name}
            rows={3}
            defaultValue={(spec?.[f.name] as string | null) ?? ""}
          />
        </Field>
      ))}
    </FormDialog>
  )
}
