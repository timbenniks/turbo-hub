"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Plus } from "lucide-react"
import { toast } from "sonner"

import { useAsyncAction } from "@/hooks/use-async-action"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { apiSend } from "@/lib/client"
import { API_KEY_SCOPES, type ApiKeyScope } from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { ApiKeyPublic } from "@/lib/services/api-keys"

export type ProjectOption = { id: string; name: string }

export function ApiKeysManager({
  keys,
  projects,
}: {
  keys: ApiKeyPublic[]
  projects: ProjectOption[]
}) {
  const { busy, run } = useAsyncAction()
  const projectName = new Map(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CreateKeyDialog projects={projects} />
      </div>

      {keys.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No API keys yet. Create one to let an agent or CLI call the API.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  <code>{key.prefix}…</code> · created{" "}
                  {new Date(key.createdAt).toLocaleDateString()} · last used{" "}
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleDateString()
                    : "never"}{" "}
                  · expires{" "}
                  {key.expiresAt
                    ? new Date(key.expiresAt).toLocaleDateString()
                    : "never"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {key.scopes.map(labelize).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Projects:{" "}
                  {key.allowedProjectIds?.length
                    ? key.allowedProjectIds
                        .map((id) => projectName.get(id) ?? id)
                        .join(", ")
                    : "all"}{" "}
                  · Tools:{" "}
                  {key.allowedToolNames?.length
                    ? `${key.allowedToolNames.length} allowed`
                    : "all"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => {
                  if (!confirm(`Revoke "${key.name}"? This can't be undone.`))
                    return
                  run(
                    () => apiSend(`/api/api-keys/${key.id}`, "DELETE"),
                    "Key revoked"
                  )
                }}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CreateKeyDialog({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [scopes, setScopes] = React.useState<ApiKeyScope[]>([
    ...API_KEY_SCOPES,
  ])
  const [allowedProjectIds, setAllowedProjectIds] = React.useState<string[]>([])
  const [toolNames, setToolNames] = React.useState("")
  const [expiresAt, setExpiresAt] = React.useState("")
  const [token, setToken] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  function reset() {
    setOpen(false)
    setName("")
    setScopes([...API_KEY_SCOPES])
    setAllowedProjectIds([])
    setToolNames("")
    setExpiresAt("")
    setToken(null)
    setCopied(false)
  }

  async function create() {
    setBusy(true)
    try {
      const allowedToolNames = toolNames
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const { token } = await apiSend<{ token: string }>(
        "/api/api-keys",
        "POST",
        {
          name,
          scopes,
          allowedProjectIds: allowedProjectIds.length
            ? allowedProjectIds
            : undefined,
          allowedToolNames: allowedToolNames.length
            ? allowedToolNames
            : undefined,
          expiresAt: expiresAt
            ? new Date(`${expiresAt}T23:59:59.999Z`).toISOString()
            : undefined,
        }
      )
      setToken(token)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create key")
    } finally {
      setBusy(false)
    }
  }

  function toggleProject(id: string) {
    setAllowedProjectIds((current) =>
      current.includes(id)
        ? current.filter((p) => p !== id)
        : [...current, id]
    )
  }

  async function copy() {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      toast.success("Token copied")
    } catch {
      toast.error("Couldn't access the clipboard")
    }
  }

  function toggleScope(scope: ApiKeyScope) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter((s) => s !== scope)
        : [...current, scope]
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : reset())}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Create key
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {token ? "Copy your API key" : "Create API key"}
          </DialogTitle>
          <DialogDescription>
            {token
              ? "This is the only time the token is shown. Store it somewhere safe."
              : "Give the key a name so you can recognize it later."}
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <code className="min-w-0 flex-1 text-xs break-all">{token}</code>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Name" htmlFor="key-name">
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude agent"
                autoFocus
              />
            </Field>
            <Field label="Scopes">
              <div className="grid gap-2 sm:grid-cols-2">
                {API_KEY_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={scopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                    {labelize(scope)}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Projects (optional — empty = all)">
              {projects.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No projects yet. The token will have access to all projects.
                </p>
              ) : (
                <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={allowedProjectIds.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                      />
                      <span className="truncate">{project.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Tools (optional — empty = all)" htmlFor="key-tools">
              <Input
                id="key-tools"
                value={toolNames}
                onChange={(e) => setToolNames(e.target.value)}
                placeholder="e.g. list_tasks, create_task, append_run_event"
              />
            </Field>
            <Field label="Expires" htmlFor="key-expires">
              <Input
                id="key-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          {token ? (
            <Button onClick={reset}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button
                onClick={create}
                disabled={busy || !name.trim() || scopes.length === 0}
              >
                Create
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
