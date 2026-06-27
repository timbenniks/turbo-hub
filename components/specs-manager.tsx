"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SpecFormDialog } from "@/components/spec-form-dialog"
import { apiSend } from "@/lib/client"
import { labelize } from "@/lib/labels"
import type { Spec } from "@/lib/services/specs"

export function SpecsManager({
  slug,
  projectId,
  specs,
}: {
  slug: string
  projectId: string
  specs: Spec[]
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Specs</h2>
        <div className="flex gap-2">
          <SpecFormDialog
            title="New spec"
            trigger={
              <Button variant="outline">
                <Plus />
                New spec
              </Button>
            }
            disabled={busy}
            onSubmit={(values) =>
              run(
                () =>
                  apiSend(`/api/projects/${projectId}/specs`, "POST", values),
                "Spec created"
              )
            }
          />
        </div>
      </div>

      {specs.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No specs yet. Write one manually, or have your agent create one via
          MCP.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {specs.map((spec) => (
            <Link
              key={spec.id}
              href={`/projects/${slug}/specs/${spec.id}`}
              prefetch
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{spec.title}</p>
                {spec.summary && (
                  <p className="truncate text-xs text-muted-foreground">
                    {spec.summary}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  v{spec.version}
                </span>
                <Badge variant="secondary">{labelize(spec.status)}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
