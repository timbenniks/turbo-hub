import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { getProjectById } from "@/lib/services/projects"
import {
  getRepository,
  linkProjectRepository,
  listRepositories,
  upsertRepository,
} from "@/lib/services/repositories"
import {
  projectRepositoryLinkSchema,
  repositoryCreateSchema,
} from "@/lib/validation/repositories"
import {
  requireAuth,
  requireWriteAuth,
  resolveProject,
} from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerRepositoryTools(server: McpServer) {
  server.registerTool(
    "list_repositories",
    {
      title: "List repositories",
      description: "List repositories known to the workspace.",
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
        const rows = await listRepositories(workspaceId)
        return ok(rows, `${rows.length} repository/repositories.`)
      })
  )

  server.registerTool(
    "get_repository",
    {
      title: "Get repository",
      description: "Fetch one repository by id.",
      inputSchema: { repositoryId: z.string() },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getRepository(workspaceId, args.repositoryId)
        return row ? ok(row) : fail("Repository not found.")
      })
  )

  server.registerTool(
    "get_project_repository",
    {
      title: "Get project repository",
      description: "Fetch the repository linked to a project, if any.",
      inputSchema: { project: projectRef },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const projectId = await resolveProject(workspaceId, args.project)
        const project = await getProjectById(workspaceId, projectId)
        if (!project?.repositoryId)
          return fail("Project has no linked repository.")
        const row = await getRepository(workspaceId, project.repositoryId)
        return row ? ok(row) : fail("Linked repository not found.")
      })
  )

  server.registerTool(
    "upsert_repository",
    {
      title: "Upsert repository",
      description:
        "Create or update a workspace repository record. GitHub is the supported provider.",
      inputSchema: repositoryCreateSchema.shape,
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const row = await upsertRepository(
          ctx,
          workspaceId,
          repositoryCreateSchema.parse(args)
        )
        return ok(row, `Saved repository ${row.fullName} (id ${row.id}).`)
      })
  )

  server.registerTool(
    "link_project_repository",
    {
      title: "Link project repository",
      description:
        "Link a GitHub repository to a project by repository id, GitHub URL, or owner/name.",
      inputSchema: {
        project: projectRef,
        ...projectRepositoryLinkSchema.shape,
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const projectId = await resolveProject(workspaceId, project)
        const row = await linkProjectRepository(
          ctx,
          workspaceId,
          projectId,
          projectRepositoryLinkSchema.parse(rest)
        )
        return ok(row, `Linked repository ${row.fullName}.`)
      })
  )
}
