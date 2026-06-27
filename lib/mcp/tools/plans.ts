import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  markPlanActive,
  updatePlan,
} from "@/lib/services/plans"
import { planCreateSchema, planUpdateSchema } from "@/lib/validation/plans"
import { requireAuth, requireWriteAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerPlanTools(server: McpServer) {
  server.registerTool(
    "list_plans",
    {
      title: "List plans",
      description: "List all plans for a project (newest version first).",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const rows = await listPlans(workspaceId, id)
        return ok(rows, `${rows.length} plan(s).`)
      })
  )

  server.registerTool(
    "create_plan",
    {
      title: "Create plan",
      description:
        "Create a plan for a project. Provide a Markdown `body` or the structured section fields.",
      inputSchema: { project: projectRef, ...planCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const plan = await createPlan(
          ctx,
          workspaceId,
          id,
          planCreateSchema.parse(rest)
        )
        return ok(plan, `Created plan "${plan.title}" (id ${plan.id}).`)
      })
  )

  server.registerTool(
    "get_plan",
    {
      title: "Get plan",
      description: "Fetch one plan by its id.",
      inputSchema: { planId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const plan = await getPlan(workspaceId, args.planId)
        return plan ? ok(plan) : fail("Plan not found.")
      })
  )

  server.registerTool(
    "update_plan",
    {
      title: "Update plan",
      description: "Update fields on a plan by its id.",
      inputSchema: { planId: z.string(), ...planUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { planId, ...rest } = args
        const plan = await updatePlan(
          ctx,
          workspaceId,
          planId,
          planUpdateSchema.parse(rest)
        )
        return plan ? ok(plan, `Updated plan "${plan.title}".`) : fail("Plan not found.")
      })
  )

  server.registerTool(
    "delete_plan",
    {
      title: "Delete plan",
      description: "Permanently delete a plan by its id. This cannot be undone.",
      inputSchema: { planId: z.string() },
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
        const plan = await deletePlan(ctx, workspaceId, args.planId)
        return plan ? ok(plan, `Deleted plan "${plan.title}".`) : fail("Plan not found.")
      })
  )

  server.registerTool(
    "activate_plan",
    {
      title: "Activate plan",
      description:
        "Mark a plan active (supersedes any other active plan in the project).",
      inputSchema: { planId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const plan = await markPlanActive(ctx, workspaceId, args.planId)
        return plan
          ? ok(plan, `Activated plan "${plan.title}".`)
          : fail("Plan not found.")
      })
  )
}
