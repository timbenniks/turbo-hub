"use client"

import * as React from "react"
import { FileText } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { Textarea } from "@/components/ui/textarea"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"

export type ContextPackView = {
  id: string
  title: string
  status: "draft" | "approved" | "sent" | "archived"
  tokenEstimate: number
  body: string
}

export function ContextPackPanel({
  taskId,
  packs,
}: {
  taskId: string
  packs: ContextPackView[]
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Context packs
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(
              () => apiSend(`/api/tasks/${taskId}/context-packs`, "POST", {}),
              "Context pack assembled"
            )
          }
        >
          <FileText />
          Assemble
        </Button>
      </div>

      {packs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          None yet. Assemble one from this task&apos;s spec, decisions,
          learnings, and relevant patterns into agent-ready context.
        </p>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => {
            const frozen = pack.status === "sent"
            return (
              <div
                key={pack.id}
                className="space-y-2 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{pack.title}</span>
                    <Badge variant={frozen ? "default" : "secondary"}>
                      {frozen ? "Frozen" : labelize(pack.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ~{pack.tokenEstimate} tokens
                    </span>
                  </div>
                  {!frozen && (
                    <div className="flex items-center gap-2">
                      <EditPackDialog pack={pack} disabled={busy} run={run} />
                      {pack.status === "draft" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () =>
                                apiSend(
                                  `/api/context-packs/${pack.id}/approve`,
                                  "POST"
                                ),
                              "Context pack approved"
                            )
                          }
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !confirm(
                              "Freeze this context pack? It becomes immutable."
                            )
                          )
                            return
                          run(
                            () =>
                              apiSend(
                                `/api/context-packs/${pack.id}/send`,
                                "POST"
                              ),
                            "Context pack frozen"
                          )
                        }}
                      >
                        Freeze
                      </Button>
                    </div>
                  )}
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    View body
                  </summary>
                  <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
                    <Markdown>{pack.body}</Markdown>
                  </div>
                </details>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditPackDialog({
  pack,
  disabled,
  run,
}: {
  pack: ContextPackView
  disabled?: boolean
  run: (
    fn: () => Promise<unknown>,
    msg: string
  ) => Promise<boolean>
}) {
  return (
    <FormDialog
      title="Edit context pack"
      submitLabel="Save"
      trigger={
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      }
      disabled={disabled}
      onSubmit={(values) =>
        run(
          () => apiSend(`/api/context-packs/${pack.id}`, "PATCH", values),
          "Context pack updated"
        )
      }
    >
      <Field label="Title" htmlFor="pack-title">
        <Input id="pack-title" name="title" defaultValue={pack.title} required />
      </Field>
      <Field label="Body (Markdown)" htmlFor="pack-body">
        <Textarea
          id="pack-body"
          name="body"
          rows={18}
          defaultValue={pack.body}
        />
      </Field>
    </FormDialog>
  )
}
