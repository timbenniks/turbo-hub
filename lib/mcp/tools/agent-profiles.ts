import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createAgentProfile,
  getAgentProfile,
  listAgentProfiles,
  updateAgentProfile,
} from "@/lib/services/agentProfiles"
import {
  agentProfileCreateSchema,
  agentProfileUpdateSchema,
} from "@/lib/validation/agent-profiles"
import { requireAuth, requireWriteAuth } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

export function registerAgentProfileTools(server: McpServer) {
  server.registerTool(
    "list_agent_profiles",
    {
      title: "List agent profiles",
      description: "List configured runner/agent profiles in the workspace.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (_args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listAgentProfiles(workspaceId)
        return ok(rows, `${rows.length} profile(s).`)
      })
  )

  server.registerTool(
    "get_agent_profile",
    {
      title: "Get agent profile",
      description: "Fetch one agent profile by its id.",
      inputSchema: { profileId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getAgentProfile(workspaceId, args.profileId)
        return row ? ok(row) : fail("Agent profile not found.")
      })
  )

  server.registerTool(
    "create_agent_profile",
    {
      title: "Create agent profile",
      description:
        "Create a runner/agent profile (type: cursor_cloud/claude_local/manual/custom_api).",
      inputSchema: agentProfileCreateSchema.shape,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await createAgentProfile(
          ctx,
          workspaceId,
          agentProfileCreateSchema.parse(args)
        )
        return ok(row, `Created profile "${row.name}" (id ${row.id}).`)
      })
  )

  server.registerTool(
    "update_agent_profile",
    {
      title: "Update agent profile",
      description: "Update fields on an agent profile by its id.",
      inputSchema: { profileId: z.string(), ...agentProfileUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { profileId, ...rest } = args
        const row = await updateAgentProfile(
          ctx,
          workspaceId,
          profileId,
          agentProfileUpdateSchema.parse(rest)
        )
        return row
          ? ok(row, `Updated profile "${row.name}".`)
          : fail("Agent profile not found.")
      })
  )
}
