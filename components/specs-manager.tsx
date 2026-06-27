"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import { StatusChip } from "@/components/ui/status-chip"
import { CompactProjectHeader } from "@/components/compact-project-header"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { SpecFormDialog } from "@/components/spec-form-dialog"
import { apiSend } from "@/lib/client"
import type { Spec } from "@/lib/services/specs"

export function SpecsManager({
  slug,
  projectName,
  projectId,
  specs,
}: {
  slug: string
  projectName: string
  projectId: string
  specs: Spec[]
}) {
  const { busy, run } = useAsyncAction()

  const createSpec = (
    <SpecFormDialog
      title="New spec"
      trigger={
        <Button variant="outline" size="sm">
          <Plus />
          New spec
        </Button>
      }
      disabled={busy}
      onSubmit={(values) =>
        run(
          () => apiSend(`/api/projects/${projectId}/specs`, "POST", values),
          "Spec created"
        )
      }
    />
  )

  return (
    <div className="space-y-6">
      <CompactProjectHeader
        slug={slug}
        projectName={projectName}
        title="Specs"
        meta={
          <span>
            {specs.length === 0
              ? "No specs yet"
              : `${specs.length} spec${specs.length === 1 ? "" : "s"}`}
          </span>
        }
        actions={createSpec}
      />

      {specs.length === 0 ? (
        <HelpfulEmptyState
          title="No specs yet"
          description="A spec turns the plan into something an agent can execute: scope, acceptance criteria, and the tasks that follow. Write one manually, or have your agent create one via MCP."
        />
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
                <span className="font-mono text-xs text-muted-foreground">
                  v{spec.version}
                </span>
                <StatusChip value={spec.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
