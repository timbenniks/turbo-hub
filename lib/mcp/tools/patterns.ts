import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  archivePattern,
  createPattern,
  getPattern,
  listPatterns,
  recordPatternUsage,
  searchPatterns,
  updatePattern,
} from "@/lib/services/patterns"
import {
  patternCreateSchema,
  patternSearchSchema,
  patternUpdateSchema,
} from "@/lib/validation/patterns"
import { requireAuth, requireWriteAuth } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

export function registerPatternTools(server: McpServer) {
  server.registerTool(
    "list_patterns",
    {
      title: "List patterns",
      description:
        "List reusable patterns in the workspace (most-used first). Excludes archived unless includeArchived is set.",
      inputSchema: { includeArchived: z.boolean().optional() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listPatterns(workspaceId, {
          includeArchived: args.includeArchived,
        })
        return ok(rows, `${rows.length} pattern(s).`)
      })
  )

  server.registerTool(
    "get_pattern",
    {
      title: "Get pattern",
      description: "Fetch one pattern by its id.",
      inputSchema: { patternId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getPattern(workspaceId, args.patternId)
        return row ? ok(row) : fail("Pattern not found.")
      })
  )

  server.registerTool(
    "search_patterns",
    {
      title: "Search patterns",
      description:
        "Full-text search reusable patterns, filtered by tags/stack/type. Use before starting work to find prior art.",
      inputSchema: patternSearchSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await searchPatterns(
          workspaceId,
          patternSearchSchema.parse(args)
        )
        return ok(rows, `${rows.length} pattern(s).`)
      })
  )

  server.registerTool(
    "create_pattern",
    {
      title: "Create pattern",
      description: "Create a reusable pattern directly in the workspace library.",
      inputSchema: patternCreateSchema.shape,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await createPattern(
          ctx,
          workspaceId,
          patternCreateSchema.parse(args)
        )
        return ok(row, `Created pattern "${row.summary}" (id ${row.id}).`)
      })
  )

  server.registerTool(
    "update_pattern",
    {
      title: "Update pattern",
      description: "Update fields on a pattern by its id.",
      inputSchema: { patternId: z.string(), ...patternUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { patternId, ...rest } = args
        const row = await updatePattern(
          ctx,
          workspaceId,
          patternId,
          patternUpdateSchema.parse(rest)
        )
        return row
          ? ok(row, `Updated pattern "${row.summary}".`)
          : fail("Pattern not found.")
      })
  )

  server.registerTool(
    "archive_pattern",
    {
      title: "Archive pattern",
      description: "Archive a pattern so it stops surfacing in searches.",
      inputSchema: { patternId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await archivePattern(ctx, workspaceId, args.patternId)
        return row
          ? ok(row, `Archived pattern "${row.summary}".`)
          : fail("Pattern not found.")
      })
  )

  server.registerTool(
    "record_pattern_usage",
    {
      title: "Record pattern usage",
      description:
        "Record that a pattern was applied — bumps its usage count and last-used time.",
      inputSchema: { patternId: z.string() },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await recordPatternUsage(ctx, workspaceId, args.patternId)
        return row
          ? ok(row, `Recorded usage of "${row.summary}" (count ${row.usageCount}).`)
          : fail("Pattern not found.")
      })
  )
}
