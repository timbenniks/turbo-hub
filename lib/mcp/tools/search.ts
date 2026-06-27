import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { searchMemory } from "@/lib/services/search"
import { requireAuth } from "@/lib/mcp/context"
import { handle, ok } from "@/lib/mcp/format"

export function registerSearchTools(server: McpServer) {
  server.registerTool(
    "search_memory",
    {
      title: "Search memory",
      description:
        "Full-text search across the workspace's durable memory — decisions, learnings, and patterns. Use to recall prior context before starting work.",
      inputSchema: {
        query: z.string().min(1).describe("Search text"),
        limit: z.number().int().min(1).max(50).optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const results = await searchMemory(workspaceId, args.query, {
          limit: args.limit,
        })
        const total =
          results.decisions.length +
          results.learnings.length +
          results.patterns.length
        return ok(results, `${total} match(es) across memory.`)
      })
  )
}
