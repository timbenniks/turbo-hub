import { ApiKeysManager } from "@/components/api-keys-manager"
import { IntegrationsManager } from "@/components/integrations-manager"
import { McpAudit } from "@/components/mcp-audit"
import { ThemeSwitch } from "@/components/theme-switch"
import { requireSessionUser } from "@/lib/auth/context"
import { listAgentAuditEvents } from "@/lib/services/activity"
import { listApiKeys } from "@/lib/services/api-keys"
import { listIntegrations } from "@/lib/services/integrations"
import { listProjects } from "@/lib/services/projects"
import { listInstalledGitHubRepositories } from "@/lib/services/repositories"
import { getPrimaryWorkspaceId } from "@/lib/services/workspaces"

export default async function SettingsPage() {
  const ctx = await requireSessionUser()
  const workspaceId = await getPrimaryWorkspaceId(ctx.userId)
  const [keys, integrations, projects, repositories, auditEvents] =
    await Promise.all([
      listApiKeys(ctx.userId),
      workspaceId ? listIntegrations(workspaceId) : Promise.resolve([]),
      workspaceId
        ? listProjects(workspaceId, { includeArchived: true })
        : Promise.resolve([]),
      workspaceId
        ? listInstalledGitHubRepositories(workspaceId)
        : Promise.resolve([]),
      workspaceId ? listAgentAuditEvents(workspaceId) : Promise.resolve([]),
    ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access, credentials, and external agent configuration.
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Choose a theme. Light is the default; System follows your operating
            system.
          </p>
        </div>
        <ThemeSwitch />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
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
          <ApiKeysManager
            keys={keys}
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Store provider credentials for repository and runner adapters.
              Secret values are encrypted at rest and never shown again.
            </p>
          </div>
          <IntegrationsManager
            integrations={integrations}
            repositories={repositories.map((repo) => ({
              id: repo.id,
              fullName: repo.fullName,
              url: repo.url,
            }))}
          />
        </section>
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Agent audit log</h2>
          <p className="text-sm text-muted-foreground">
            Every write an agent makes through the MCP server is recorded here —
            which tool ran, under which token, and when.
          </p>
        </div>
        <McpAudit events={auditEvents} />
      </section>
    </div>
  )
}
