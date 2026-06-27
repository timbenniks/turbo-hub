import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  deleteIntegration,
  listIntegrations,
  upsertIntegration,
} from "@/lib/services/integrations"
import { integrationCreateSchema } from "@/lib/validation/integrations"
import { requireAuth, requireWriteAuth } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

export function registerIntegrationTools(server: McpServer) {
  server.registerTool(
    "list_integrations",
    {
      title: "List integrations",
      description:
        "List configured provider integrations. Secret values are never returned.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    (_args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listIntegrations(workspaceId)
        return ok(rows, `${rows.length} integration(s).`)
      })
  )

  server.registerTool(
    "upsert_integration",
    {
      title: "Upsert integration",
      description:
        "Create or update an integration. If `secret` is supplied, it is encrypted at rest and never returned by list/read tools.",
      inputSchema: integrationCreateSchema.shape,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await upsertIntegration(
          ctx,
          workspaceId,
          integrationCreateSchema.parse(args)
        )
        return ok(row, `Saved ${row.provider} integration "${row.name}".`)
      })
  )

  server.registerTool(
    "delete_integration",
    {
      title: "Delete integration",
      description: "Delete an integration and its stored encrypted secret.",
      inputSchema: { integrationId: z.string() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const okDelete = await deleteIntegration(
          ctx,
          workspaceId,
          args.integrationId
        )
        return okDelete
          ? ok({ ok: true }, "Integration deleted.")
          : fail("Integration not found.")
      })
  )
}
