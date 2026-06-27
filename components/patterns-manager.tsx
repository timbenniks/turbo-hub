"use client"

import * as React from "react"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Markdown } from "@/components/ui/markdown"
import { Textarea } from "@/components/ui/textarea"
import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import { apiSend } from "@/lib/client"

/** Subset of a pattern the UI renders (date fields are ignored). */
export type PatternView = {
  id: string
  summary: string
  body: string | null
  appliesTo: string | null
  type: string | null
  tags: string[]
  stack: string[]
  usageCount: number
}

function parseList(raw?: string): string[] {
  return (raw ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function toPayload(values: Record<string, string>) {
  return {
    summary: values.summary,
    body: values.body || undefined,
    appliesTo: values.appliesTo || undefined,
    type: values.type || undefined,
    tags: parseList(values.tags),
    stack: parseList(values.stack),
  }
}

export function PatternsManager({ initial }: { initial: PatternView[] }) {
  const { busy, run } = useAsyncAction()
  const [items, setItems] = React.useState(initial)
  const [query, setQuery] = React.useState("")
  const [tags, setTags] = React.useState("")
  const [type, setType] = React.useState("")
  const [searching, setSearching] = React.useState(false)

  const load = React.useCallback(async () => {
    setSearching(true)
    try {
      const rows = await apiSend<PatternView[]>("/api/patterns/search", "POST", {
        query: query.trim() || undefined,
        tags: parseList(tags),
        type: type.trim() || undefined,
        limit: 50,
      })
      setItems(rows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }, [query, tags, type])

  // After a mutation, refresh the current view (re-run the active search).
  const runThenReload = (fn: () => Promise<unknown>, msg: string) =>
    run(fn, msg, { refresh: false }).then((ok) => {
      if (ok) load()
      return ok
    })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Patterns</h1>
          <p className="text-sm text-muted-foreground">
            Reusable knowledge that compounds across projects.
          </p>
        </div>
        <PatternFormDialog
          title="New pattern"
          trigger={
            <Button>
              <Plus />
              New pattern
            </Button>
          }
          disabled={busy}
          onSubmit={(values) =>
            runThenReload(
              () => apiSend("/api/patterns", "POST", toPayload(values)),
              "Pattern created"
            )
          }
        />
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          load()
        }}
      >
        <Field label="Search" htmlFor="pattern-q">
          <Input
            id="pattern-q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Full-text query…"
          />
        </Field>
        <Field label="Tags" htmlFor="pattern-tags-filter">
          <Input
            id="pattern-tags-filter"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="auth, caching"
          />
        </Field>
        <Field label="Type" htmlFor="pattern-type-filter">
          <Input
            id="pattern-type-filter"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="convention"
          />
        </Field>
        <Button type="submit" variant="outline" disabled={searching}>
          <Search />
          Search
        </Button>
      </form>

      {items.length === 0 ? (
        <HelpfulEmptyState
          title="No patterns found"
          description="Patterns are reusable knowledge that compounds across projects — promote a learning, create one directly, or have your agent add it via MCP."
        />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[0.9375rem] font-semibold">{p.summary}</h3>
                  {p.type && <Badge variant="secondary">{p.type}</Badge>}
                  <Badge variant="outline">used {p.usageCount}×</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      runThenReload(
                        () => apiSend(`/api/patterns/${p.id}/use`, "POST"),
                        "Marked used"
                      )
                    }
                  >
                    Mark used
                  </Button>
                  <PatternFormDialog
                    title="Edit pattern"
                    pattern={p}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    }
                    disabled={busy}
                    onSubmit={(values) =>
                      runThenReload(
                        () =>
                          apiSend(
                            `/api/patterns/${p.id}`,
                            "PATCH",
                            toPayload(values)
                          ),
                        "Pattern updated"
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(`Archive pattern "${p.summary}"?`)) return
                      runThenReload(
                        () => apiSend(`/api/patterns/${p.id}`, "DELETE"),
                        "Pattern archived"
                      )
                    }}
                  >
                    Archive
                  </Button>
                </div>
              </div>
              {p.appliesTo && (
                <p className="text-sm text-muted-foreground">
                  Applies to: {p.appliesTo}
                </p>
              )}
              {p.body && <Markdown>{p.body}</Markdown>}
              {(p.tags.length > 0 || p.stack.length > 0) && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <Badge key={`tag-${t}`} variant="outline">
                      {t}
                    </Badge>
                  ))}
                  {p.stack.map((s) => (
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

function PatternFormDialog({
  title,
  pattern,
  trigger,
  onSubmit,
  disabled,
}: {
  title: string
  pattern?: PatternView
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
      <Field label="Summary" htmlFor="pattern-summary">
        <Input
          id="pattern-summary"
          name="summary"
          defaultValue={pattern?.summary}
          required
        />
      </Field>
      <Field label="Applies to" htmlFor="pattern-applies">
        <Input
          id="pattern-applies"
          name="appliesTo"
          defaultValue={pattern?.appliesTo ?? ""}
          placeholder="When to reach for this"
        />
      </Field>
      <Field label="Details (Markdown)" htmlFor="pattern-body">
        <Textarea
          id="pattern-body"
          name="body"
          rows={6}
          defaultValue={pattern?.body ?? ""}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Type" htmlFor="pattern-type">
          <Input
            id="pattern-type"
            name="type"
            defaultValue={pattern?.type ?? ""}
            placeholder="convention"
          />
        </Field>
        <Field label="Tags" htmlFor="pattern-tags">
          <Input
            id="pattern-tags"
            name="tags"
            defaultValue={pattern?.tags.join(", ") ?? ""}
          />
        </Field>
        <Field label="Stack" htmlFor="pattern-stack">
          <Input
            id="pattern-stack"
            name="stack"
            defaultValue={pattern?.stack.join(", ") ?? ""}
          />
        </Field>
      </div>
    </FormDialog>
  )
}
