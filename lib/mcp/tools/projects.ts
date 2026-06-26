import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  archiveProject,
  createProject,
  getProjectById,
  listProjects,
  updateProject,
} from "@/lib/services/projects"
import {
  projectCreateSchema,
  projectListFiltersSchema,
  projectUpdateSchema,
} from "@/lib/validation/projects"
import { requireAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerProjectTools(server: McpServer) {
  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "List projects in the workspace, optionally filtered.",
      inputSchema: projectListFiltersSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listProjects(
          workspaceId,
          projectListFiltersSchema.parse(args)
        )
        return ok(rows, `${rows.length} project(s).`)
      })
  )

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description: "Fetch one project by id, slug, or exact name.",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const p = await getProjectById(workspaceId, id)
        return p ? ok(p) : fail("Project not found.")
      })
  )

  server.registerTool(
    "create_project",
    {
      title: "Create project",
      description: "Create a project. Only `name` is required.",
      inputSchema: projectCreateSchema.shape,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const p = await createProject(
          ctx,
          workspaceId,
          projectCreateSchema.parse(args)
        )
        return ok(p, `Created "${p.name}" (id ${p.id}, slug ${p.slug}).`)
      })
  )

  server.registerTool(
    "update_project",
    {
      title: "Update project",
      description: "Update fields on a project (id, slug, or name).",
      inputSchema: { project: projectRef, ...projectUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const p = await updateProject(
          ctx,
          workspaceId,
          id,
          projectUpdateSchema.parse(rest)
        )
        return p ? ok(p, `Updated "${p.name}".`) : fail("Project not found.")
      })
  )

  server.registerTool(
    "archive_project",
    {
      title: "Archive project",
      description:
        "Archive (soft-delete) a project. Accepts id, slug, or name. Recoverable.",
      inputSchema: { project: projectRef },
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
        const id = await resolveProject(workspaceId, args.project)
        const p = await archiveProject(ctx, workspaceId, id)
        return p
          ? ok(p, `Archived "${p.name}".`)
          : fail("Project not found or already archived.")
      })
  )
}
