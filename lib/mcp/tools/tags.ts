import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
} from "@/lib/services/tags"
import { tagCreateSchema, tagUpdateSchema } from "@/lib/validation/tags"
import { requireAuth } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

export function registerTagTools(server: McpServer) {
  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "List all tags in the workspace.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (_args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listTags(workspaceId)
        return ok(rows, `${rows.length} tag(s).`)
      })
  )

  server.registerTool(
    "create_tag",
    {
      title: "Create tag",
      description: "Create a workspace tag.",
      inputSchema: tagCreateSchema.shape,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const tag = await createTag(ctx, workspaceId, tagCreateSchema.parse(args))
        return ok(tag, `Created tag "${tag.name}" (id ${tag.id}).`)
      })
  )

  server.registerTool(
    "update_tag",
    {
      title: "Update tag",
      description: "Update a tag's name or color by its id.",
      inputSchema: { tagId: z.string(), ...tagUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const { tagId, ...rest } = args
        const tag = await updateTag(
          ctx,
          workspaceId,
          tagId,
          tagUpdateSchema.parse(rest)
        )
        return tag ? ok(tag, `Updated tag "${tag.name}".`) : fail("Tag not found.")
      })
  )

  server.registerTool(
    "delete_tag",
    {
      title: "Delete tag",
      description: "Delete a tag by its id. This cannot be undone.",
      inputSchema: { tagId: z.string() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const tag = await deleteTag(ctx, workspaceId, args.tagId)
        return tag ? ok(tag, `Deleted tag "${tag.name}".`) : fail("Tag not found.")
      })
  )
}
