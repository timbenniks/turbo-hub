import { HelpfulEmptyState } from "@/components/helpful-empty-state"
import type { ActivityEvent } from "@/lib/services/activity"

/**
 * Read-only audit trail of agent (MCP) writes. Each row is an
 * `actor_type = "agent"` activity event recorded by the tool guard.
 */
export function McpAudit({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <HelpfulEmptyState
        title="No agent activity yet"
        description="When an agent calls a write tool through the MCP server with one of your tokens, it's recorded here — tool, token, and time — so you can see exactly what ran."
      />
    )
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {events.map((event) => {
        const tokenId =
          event.metadata &&
          typeof event.metadata === "object" &&
          "tokenId" in event.metadata
            ? String((event.metadata as { tokenId?: unknown }).tokenId)
            : null
        return (
          <li
            key={event.id}
            className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{event.title}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {event.type}
                {tokenId ? ` · token ${tokenId.slice(0, 8)}…` : ""}
              </p>
            </div>
            <time
              dateTime={new Date(event.createdAt).toISOString()}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {new Date(event.createdAt).toLocaleString()}
            </time>
          </li>
        )
      })}
    </ul>
  )
}
