import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createLearning,
  getLearning,
  listLearnings,
  promoteToPattern,
  updateLearning,
} from "@/lib/services/learnings"
import {
  learningCreateSchema,
  learningUpdateSchema,
} from "@/lib/validation/learnings"
import { requireAuth, requireWriteAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerLearningTools(server: McpServer) {
  server.registerTool(
    "list_learnings",
    {
      title: "List learnings",
      description: "List all learnings captured for a project (newest first).",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const rows = await listLearnings(workspaceId, id)
        return ok(rows, `${rows.length} learning(s).`)
      })
  )

  server.registerTool(
    "get_learning",
    {
      title: "Get learning",
      description: "Fetch one learning by its id.",
      inputSchema: { learningId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getLearning(workspaceId, args.learningId)
        return row ? ok(row) : fail("Learning not found.")
      })
  )

  server.registerTool(
    "create_learning",
    {
      title: "Create learning",
      description:
        "Capture a learning for a project (success/failure/gotcha/reusable_idea/convention/anti_pattern).",
      inputSchema: { project: projectRef, ...learningCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const row = await createLearning(
          ctx,
          workspaceId,
          id,
          learningCreateSchema.parse(rest)
        )
        return ok(row, `Captured learning "${row.title}" (id ${row.id}).`)
      })
  )

  server.registerTool(
    "update_learning",
    {
      title: "Update learning",
      description: "Update fields on a learning by its id.",
      inputSchema: { learningId: z.string(), ...learningUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { learningId, ...rest } = args
        const row = await updateLearning(
          ctx,
          workspaceId,
          learningId,
          learningUpdateSchema.parse(rest)
        )
        return row
          ? ok(row, `Updated learning "${row.title}".`)
          : fail("Learning not found.")
      })
  )

  server.registerTool(
    "promote_learning_to_pattern",
    {
      title: "Promote learning to pattern",
      description:
        "Promote a learning into a reusable pattern. Idempotent — returns the existing pattern if already promoted.",
      inputSchema: { learningId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const pattern = await promoteToPattern(ctx, workspaceId, args.learningId)
        return pattern
          ? ok(pattern, `Pattern "${pattern.summary}" (id ${pattern.id}).`)
          : fail("Learning not found.")
      })
  )
}
