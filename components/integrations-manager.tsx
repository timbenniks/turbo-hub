"use client"

import * as React from "react"
import { Plus } from "lucide-react"

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
import { NativeSelect } from "@/components/ui/native-select"
import { apiSend } from "@/lib/client"
import { INTEGRATION_PROVIDERS, type IntegrationProvider } from "@/lib/enums"
import { labelize } from "@/lib/labels"
import type { Integration } from "@/lib/services/integrations"

export function IntegrationsManager({
  integrations,
}: {
  integrations: Integration[]
}) {
  const { busy, run } = useAsyncAction()

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CreateIntegrationDialog />
      </div>

      {integrations.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No integrations configured yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {integrations.map((integration) => (
            <li
              key={integration.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">
                  {integration.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {labelize(integration.provider)} ·{" "}
                  {labelize(integration.status)}
                  {integration.hasSecret
                    ? ` · ${integration.secretPreview ?? "secret stored"}`
                    : " · no secret"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => {
                  if (!confirm(`Delete "${integration.name}"?`)) return
                  run(
                    () =>
                      apiSend(`/api/integrations/${integration.id}`, "DELETE"),
                    "Integration deleted"
                  )
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CreateIntegrationDialog() {
  const [open, setOpen] = React.useState(false)
  const [provider, setProvider] = React.useState<IntegrationProvider>("cursor")
  const [name, setName] = React.useState("Cursor")
  const [secret, setSecret] = React.useState("")
  const { busy, run } = useAsyncAction()

  function reset() {
    setOpen(false)
    setProvider("cursor")
    setName("Cursor")
    setSecret("")
  }

  async function create() {
    const ok = await run(
      () =>
        apiSend("/api/integrations", "POST", {
          provider,
          name,
          secret: secret || undefined,
        }),
      "Integration saved"
    )
    if (ok) reset()
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
            Add integration
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add integration</DialogTitle>
          <DialogDescription>
            Store provider credentials for runner and repository adapters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Provider" htmlFor="integration-provider">
            <NativeSelect
              id="integration-provider"
              value={provider}
              onChange={(event) => {
                const next = event.target.value as IntegrationProvider
                setProvider(next)
                setName(labelize(next))
              }}
              className="w-full"
            >
              {INTEGRATION_PROVIDERS.map((value) => (
                <option key={value} value={value}>
                  {labelize(value)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Name" htmlFor="integration-name">
            <Input
              id="integration-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Secret" htmlFor="integration-secret">
            <Input
              id="integration-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={
                provider === "cursor" ? "Cursor API key" : "GitHub token"
              }
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={reset}>
            Cancel
          </Button>
          <Button onClick={create} disabled={busy || !name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
