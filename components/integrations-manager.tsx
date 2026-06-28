"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Plus, RefreshCw, Webhook } from "lucide-react"

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
  repositories,
}: {
  integrations: Integration[]
  repositories: { id: string; fullName: string; url: string }[]
}) {
  const { busy, run } = useAsyncAction()
  const githubIntegration = integrations.find(
    (integration) =>
      integration.provider === "github" &&
      typeof integration.config.installationId === "string"
  )
  const githubRepositoryCount =
    typeof githubIntegration?.config.repositoryCount === "number"
      ? githubIntegration.config.repositoryCount
      : null
  const credentialIntegrations = integrations.filter(
    (integration) => integration.id !== githubIntegration?.id
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          render={<Link href="/api/integrations/github/install" />}
        >
          <Webhook />
          {githubIntegration ? "Reconnect GitHub App" : "Connect GitHub App"}
        </Button>
        <CreateIntegrationDialog />
      </div>

      {githubIntegration ? (
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-medium">
                GitHub App connected
              </p>
              <p className="text-xs text-muted-foreground">
                {typeof githubIntegration.config.accountLogin === "string"
                  ? `${githubIntegration.config.accountLogin} · `
                  : ""}
                {githubRepositoryCount === null
                  ? "Repositories synced"
                  : `${githubRepositoryCount} repos synced`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(
                    () => apiSend("/api/integrations/github/resync", "POST"),
                    "GitHub repositories synced"
                  )
                }
              >
                <RefreshCw />
                Resync
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => {
                  if (!confirm("Delete GitHub App integration record?")) return
                  run(
                    () =>
                      apiSend(
                        `/api/integrations/${githubIntegration.id}`,
                        "DELETE"
                      ),
                    "Integration deleted"
                  )
                }}
              >
                Delete
              </Button>
            </div>
          </div>
          {repositories.length > 0 ? (
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {repositories.map((repository) => (
                <li key={repository.id}>
                  <a
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-xs transition-colors hover:bg-muted/40"
                  >
                    <span className="truncate">{repository.fullName}</span>
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No installed repositories synced yet.
            </p>
          )}
        </div>
      ) : null}

      {credentialIntegrations.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No integrations configured yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {credentialIntegrations.map((integration) => (
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
