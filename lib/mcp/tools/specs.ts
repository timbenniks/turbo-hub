import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createSpec,
  getSpec,
  listSpecs,
  markSpecReady,
  updateSpec,
} from "@/lib/services/specs"
import { specCreateSchema, specUpdateSchema } from "@/lib/validation/specs"
import { requireAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerSpecTools(server: McpServer) {
  server.registerTool(
    "list_specs",
    {
      title: "List specs",
      description: "List all specs for a project (newest first).",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const rows = await listSpecs(workspaceId, id)
        return ok(rows, `${rows.length} spec(s).`)
      })
  )

  server.registerTool(
    "create_spec",
    {
      title: "Create spec",
      description: "Create an implementation spec for a project.",
      inputSchema: { project: projectRef, ...specCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const spec = await createSpec(
          ctx,
          workspaceId,
          id,
          specCreateSchema.parse(rest)
        )
        return ok(spec, `Created spec "${spec.title}" (id ${spec.id}).`)
      })
  )

  server.registerTool(
    "get_spec",
    {
      title: "Get spec",
      description: "Fetch one spec by its id.",
      inputSchema: { specId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const spec = await getSpec(workspaceId, args.specId)
        return spec ? ok(spec) : fail("Spec not found.")
      })
  )

  server.registerTool(
    "update_spec",
    {
      title: "Update spec",
      description:
        "Update fields on a spec by its id. Snapshots the prior version automatically.",
      inputSchema: { specId: z.string(), ...specUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const { specId, ...rest } = args
        const spec = await updateSpec(
          ctx,
          workspaceId,
          specId,
          specUpdateSchema.parse(rest)
        )
        return spec
          ? ok(spec, `Updated spec "${spec.title}" (v${spec.version}).`)
          : fail("Spec not found.")
      })
  )

  server.registerTool(
    "mark_spec_ready",
    {
      title: "Mark spec ready",
      description: "Transition a spec to the `ready` status.",
      inputSchema: { specId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const spec = await markSpecReady(ctx, workspaceId, args.specId)
        return spec
          ? ok(spec, `Marked spec "${spec.title}" ready.`)
          : fail("Spec not found.")
      })
  )
}
