import { ApiKeysManager } from "@/components/api-keys-manager"
import { requireSessionUser } from "@/lib/auth/context"
import { listApiKeys } from "@/lib/services/api-keys"

export default async function SettingsPage() {
  const ctx = await requireSessionUser()
  const keys = await listApiKeys(ctx.userId)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">API keys</h2>
          <p className="text-sm text-muted-foreground">
            Authenticate external agents, CLIs, and MCP servers against this
            workspace&apos;s API. Send the token as{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              Authorization: Bearer &lt;token&gt;
            </code>{" "}
            (or{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              X-API-Key
            </code>
            ). A token acts as you.
          </p>
        </div>
        <ApiKeysManager keys={keys} />
      </section>
    </div>
  )
}
