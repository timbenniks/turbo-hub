import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createPullRequest,
  getPullRequest,
  listPullRequests,
  updatePullRequest,
} from "@/lib/services/pullRequests"
import {
  pullRequestCreateSchema,
  pullRequestUpdateSchema,
} from "@/lib/validation/pull-requests"
import { requireAuth, requireWriteAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerPullRequestTools(server: McpServer) {
  server.registerTool(
    "list_pull_requests",
    {
      title: "List pull requests",
      description: "List tracked pull requests for a project (newest first).",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const rows = await listPullRequests(workspaceId, id)
        return ok(rows, `${rows.length} pull request(s).`)
      })
  )

  server.registerTool(
    "get_pull_request",
    {
      title: "Get pull request",
      description: "Fetch one tracked pull request by its id.",
      inputSchema: { pullRequestId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const row = await getPullRequest(workspaceId, args.pullRequestId)
        return row ? ok(row) : fail("Pull request not found.")
      })
  )

  server.registerTool(
    "link_pull_request",
    {
      title: "Link pull request",
      description:
        "Track/link a pull request to a project (and optionally a task and run). Linking to a run adds a pr_opened event to its timeline.",
      inputSchema: { project: projectRef, ...pullRequestCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const row = await createPullRequest(
          ctx,
          workspaceId,
          id,
          pullRequestCreateSchema.parse(rest)
        )
        return ok(row, `Linked PR "${row.title}" (id ${row.id}).`)
      })
  )

  server.registerTool(
    "update_pull_request",
    {
      title: "Update pull request",
      description:
        "Update a tracked PR (e.g. set state to merged/closed). Stamps merged/closed time and adds a pr_updated event to a linked run.",
      inputSchema: { pullRequestId: z.string(), ...pullRequestUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { pullRequestId, ...rest } = args
        const row = await updatePullRequest(
          ctx,
          workspaceId,
          pullRequestId,
          pullRequestUpdateSchema.parse(rest)
        )
        return row
          ? ok(row, `Updated PR "${row.title}" (${row.state}).`)
          : fail("Pull request not found.")
      })
  )
}
