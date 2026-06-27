"use client"

import * as React from "react"
import { Plus, Sparkles } from "lucide-react"

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
import { LEARNING_TYPES } from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Learning } from "@/lib/services/learnings"

/** Split a comma/newline list into a trimmed string array. */
function parseList(raw?: string): string[] {
  return (raw ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Form strings → learning create/update payload. */
function toPayload(values: Record<string, string>) {
  return {
    title: values.title,
    body: values.body || undefined,
    type: values.type,
    confidence: values.confidence ? Number(values.confidence) : undefined,
    tags: parseList(values.tags),
    stack: parseList(values.stack),
  }
}

export function LearningsManager({
  projectId,
  learnings,
}: {
  projectId: string
  learnings: Learning[]
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Learnings</h2>
        <LearningFormDialog
          title="New learning"
          trigger={
            <Button variant="outline">
              <Plus />
              New learning
            </Button>
          }
          disabled={busy}
          onSubmit={(values) =>
            run(
              () =>
                apiSend(
                  `/api/projects/${projectId}/learnings`,
                  "POST",
                  toPayload(values)
                ),
              "Learning captured"
            )
          }
        />
      </div>

      {learnings.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No learnings yet. Capture one, or have your agent add it via MCP.
        </p>
      ) : (
        <div className="space-y-3">
          {learnings.map((l) => (
            <div
              key={l.id}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{l.title}</h3>
                  <Badge variant="secondary">{labelize(l.type)}</Badge>
                  {l.confidence != null && (
                    <Badge variant="outline">{l.confidence}% sure</Badge>
                  )}
                  {l.promotedToPattern && (
                    <Badge variant="default">Pattern</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!l.promotedToPattern && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            apiSend(`/api/learnings/${l.id}/promote`, "POST"),
                          "Promoted to pattern"
                        )
                      }
                    >
                      <Sparkles />
                      Promote
                    </Button>
                  )}
                  <LearningFormDialog
                    title="Edit learning"
                    learning={l}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    }
                    disabled={busy}
                    onSubmit={(values) =>
                      run(
                        () =>
                          apiSend(
                            `/api/learnings/${l.id}`,
                            "PATCH",
                            toPayload(values)
                          ),
                        "Learning updated"
                      )
                    }
                  />
                </div>
              </div>
              {l.body && <Markdown>{l.body}</Markdown>}
              {(l.tags.length > 0 || l.stack.length > 0) && (
                <div className="flex flex-wrap gap-1">
                  {l.tags.map((t) => (
                    <Badge key={`tag-${t}`} variant="outline">
                      {t}
                    </Badge>
                  ))}
                  {l.stack.map((s) => (
                    <Badge key={`stack-${s}`} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LearningFormDialog({
  title,
  learning,
  trigger,
  onSubmit,
  disabled,
}: {
  title: string
  learning?: Learning
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
      <Field label="Title" htmlFor="learning-title">
        <Input
          id="learning-title"
          name="title"
          defaultValue={learning?.title}
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" htmlFor="learning-type">
          <NativeSelect
            id="learning-type"
            name="type"
            defaultValue={learning?.type ?? "gotcha"}
            className="w-full"
          >
            {LEARNING_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelize(t)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Confidence (0-100)" htmlFor="learning-confidence">
          <Input
            id="learning-confidence"
            name="confidence"
            type="number"
            min={0}
            max={100}
            defaultValue={learning?.confidence ?? ""}
          />
        </Field>
      </div>
      <Field label="Details (Markdown)" htmlFor="learning-body">
        <Textarea
          id="learning-body"
          name="body"
          rows={5}
          defaultValue={learning?.body ?? ""}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tags (comma-separated)" htmlFor="learning-tags">
          <Input
            id="learning-tags"
            name="tags"
            defaultValue={learning?.tags.join(", ") ?? ""}
            placeholder="auth, caching"
          />
        </Field>
        <Field label="Stack (comma-separated)" htmlFor="learning-stack">
          <Input
            id="learning-stack"
            name="stack"
            defaultValue={learning?.stack.join(", ") ?? ""}
            placeholder="next, postgres"
          />
        </Field>
      </div>
    </FormDialog>
  )
}
