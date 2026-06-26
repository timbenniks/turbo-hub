"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReadField } from "@/components/ui/field"
import { SpecFormDialog, SPEC_FIELDS } from "@/components/spec-form-dialog"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import type { Spec } from "@/lib/services/specs"

export function SpecDetail({ slug, spec }: { slug: string; spec: Spec }) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-5">
      <Link
        href={`/projects/${slug}/specs`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All specs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{spec.title}</h2>
            <Badge variant="secondary">{labelize(spec.status)}</Badge>
            <span className="text-xs text-muted-foreground">
              v{spec.version}
            </span>
          </div>
          {spec.summary && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {spec.summary}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <SpecFormDialog
            title="Edit spec"
            spec={spec}
            trigger={
              <Button variant="outline" size="sm">
                Edit
              </Button>
            }
            disabled={busy}
            onSubmit={(values) =>
              run(
                () => apiSend(`/api/specs/${spec.id}`, "PATCH", values),
                "Spec updated"
              )
            }
          />
          {spec.status !== "ready" && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                run(
                  () => apiSend(`/api/specs/${spec.id}/ready`),
                  "Spec marked ready"
                )
              }
            >
              Mark ready
            </Button>
          )}
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run(
                () => apiSend(`/api/specs/${spec.id}/generate-tasks`),
                "Tasks generated"
              )
            }
          >
            Generate tasks
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SPEC_FIELDS.filter((f) => f.name !== "summary").map((f) => (
          <ReadField
            key={f.name}
            label={f.label}
            value={spec[f.name] as string | null}
          />
        ))}
      </div>
    </div>
  )
}
