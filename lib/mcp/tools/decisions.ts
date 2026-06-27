import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createDecision,
  getDecision,
  listDecisions,
  updateDecision,
} from "@/lib/services/decisions"
import {
  decisionCreateSchema,
  decisionUpdateSchema,
} from "@/lib/validation/decisions"
import { requireAuth, requireWriteAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerDecisionTools(server: McpServer) {
  server.registerTool(
    "list_decisions",
    {
      title: "List decisions",
      description: "List all decisions recorded for a project (newest first).",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const rows = await listDecisions(workspaceId, id)
        return ok(rows, `${rows.length} decision(s).`)
      })
  )

  server.registerTool(
    "get_decision",
    {
      title: "Get decision",
      description: "Fetch one decision by its id.",
      inputSchema: { decisionId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getDecision(workspaceId, args.decisionId)
        return row ? ok(row) : fail("Decision not found.")
      })
  )

  server.registerTool(
    "create_decision",
    {
      title: "Create decision",
      description:
        "Record a decision for a project (type/status optional; defaults to other/proposed).",
      inputSchema: { project: projectRef, ...decisionCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const row = await createDecision(
          ctx,
          workspaceId,
          id,
          decisionCreateSchema.parse(rest)
        )
        return ok(row, `Recorded decision "${row.title}" (id ${row.id}).`)
      })
  )

  server.registerTool(
    "update_decision",
    {
      title: "Update decision",
      description: "Update fields on a decision (e.g. set status to accepted).",
      inputSchema: { decisionId: z.string(), ...decisionUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { decisionId, ...rest } = args
        const row = await updateDecision(
          ctx,
          workspaceId,
          decisionId,
          decisionUpdateSchema.parse(rest)
        )
        return row
          ? ok(row, `Updated decision "${row.title}".`)
          : fail("Decision not found.")
      })
  )
}
