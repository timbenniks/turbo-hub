import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  assembleContextPack as assembleContextPackService,
  approveContextPack,
  getContextPack,
  listContextPacks,
  sendContextPack,
} from "@/lib/services/contextPacks"
import { requireAuth, requireWriteAuth } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

export function registerContextPackTools(server: McpServer) {
  server.registerTool(
    "list_context_packs",
    {
      title: "List context packs",
      description: "List the context packs assembled for a task (newest first).",
      inputSchema: { taskId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listContextPacks(workspaceId, args.taskId)
        return ok(rows, `${rows.length} context pack(s).`)
      })
  )

  server.registerTool(
    "get_context_pack",
    {
      title: "Get context pack",
      description: "Fetch one context pack (with its assembled body) by its id.",
      inputSchema: { packId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getContextPack(workspaceId, args.packId)
        return row ? ok(row) : fail("Context pack not found.")
      })
  )

  const assembleContextPack = (
    args: { taskId: string; title?: string },
    extra: unknown
  ) =>
    handle(async () => {
      const { ctx, workspaceId } = requireWriteAuth(
        extra as Parameters<typeof requireWriteAuth>[0]
      )
      const row = await assembleContextPackService(ctx, workspaceId, args.taskId, {
        title: args.title,
      })
      return row
        ? ok(
            row,
            `Assembled context pack "${row.title}" (~${row.tokenEstimate} tokens).`
          )
        : fail("Task not found.")
    })

  server.registerTool(
    "assemble_context_pack",
    {
      title: "Assemble context pack",
      description:
        "Assemble an editable context pack for a task from its spec, accepted decisions, learnings, and relevant patterns. No model call.",
      inputSchema: {
        taskId: z.string(),
        title: z.string().trim().max(200).optional(),
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    assembleContextPack
  )

  server.registerTool(
    "generate_context_pack",
    {
      title: "Assemble context pack",
      description:
        "Backward-compatible alias for assemble_context_pack. Assembles a context pack without a model call.",
      inputSchema: {
        taskId: z.string(),
        title: z.string().trim().max(200).optional(),
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    assembleContextPack
  )

  server.registerTool(
    "approve_context_pack",
    {
      title: "Approve context pack",
      description: "Approve a draft context pack (draft → approved).",
      inputSchema: { packId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await approveContextPack(ctx, workspaceId, args.packId)
        return row
          ? ok(row, `Approved context pack "${row.title}".`)
          : fail("Context pack not found or not in draft status.")
      })
  )

  server.registerTool(
    "send_context_pack",
    {
      title: "Send context pack",
      description:
        "Freeze a context pack (→ sent). It becomes immutable and cannot be edited afterward.",
      inputSchema: { packId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await sendContextPack(ctx, workspaceId, args.packId)
        return row
          ? ok(row, `Froze context pack "${row.title}".`)
          : fail("Context pack not found.")
      })
  )
}
