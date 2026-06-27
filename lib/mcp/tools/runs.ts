import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  appendRunEvent,
  cancelRun,
  completeRun,
  createRun,
  failRun,
  getRun,
  listProjectRuns,
  listRunEvents,
  listTaskRuns,
  startRun,
  updateRun,
} from "@/lib/services/runs"
import {
  runCompleteSchema,
  runCreateSchema,
  runEventCreateSchema,
  runFailSchema,
  runUpdateSchema,
} from "@/lib/validation/runs"
import { requireAuth, requireWriteAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerRunTools(server: McpServer) {
  server.registerTool(
    "list_runs",
    {
      title: "List runs",
      description: "List agent runs for a project (newest first).",
      inputSchema: { project: projectRef },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const id = await resolveProject(workspaceId, args.project)
        const rows = await listProjectRuns(workspaceId, id)
        return ok(rows, `${rows.length} run(s).`)
      })
  )

  server.registerTool(
    "list_task_runs",
    {
      title: "List task runs",
      description: "List agent runs for a single task (newest first).",
      inputSchema: { taskId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listTaskRuns(workspaceId, args.taskId)
        return ok(rows, `${rows.length} run(s).`)
      })
  )

  server.registerTool(
    "get_run",
    {
      title: "Get run",
      description: "Fetch one run, with its append-only event timeline.",
      inputSchema: { runId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const run = await getRun(workspaceId, args.runId)
        if (!run) return fail("Run not found.")
        const events = await listRunEvents(workspaceId, args.runId)
        return ok({ ...run, events })
      })
  )

  server.registerTool(
    "create_run",
    {
      title: "Create run",
      description:
        "Start a run against a task (runnerType defaults to 'manual'). Attach a contextPackId to ground the agent.",
      inputSchema: { project: projectRef, ...runCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const run = await createRun(
          ctx,
          workspaceId,
          id,
          runCreateSchema.parse(rest)
        )
        return ok(run, `Created run ${run.id} (${run.status}).`)
      })
  )

  server.registerTool(
    "start_run",
    {
      title: "Start run",
      description: "Mark a run as running and stamp its start time.",
      inputSchema: { runId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const run = await startRun(ctx, workspaceId, args.runId)
        return run ? ok(run, `Run ${run.id} running.`) : fail("Run not found.")
      })
  )

  server.registerTool(
    "update_run",
    {
      title: "Update run",
      description: "Update a run's status/summary/error/branch.",
      inputSchema: { runId: z.string(), ...runUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { runId, ...rest } = args
        const run = await updateRun(
          ctx,
          workspaceId,
          runId,
          runUpdateSchema.parse(rest)
        )
        return run ? ok(run, `Run ${run.id} updated.`) : fail("Run not found.")
      })
  )

  server.registerTool(
    "append_run_event",
    {
      title: "Append run event",
      description:
        "Append an event to a run's timeline (append-only — events cannot be edited or deleted).",
      inputSchema: { runId: z.string(), ...runEventCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { runId, ...rest } = args
        const event = await appendRunEvent(
          ctx,
          workspaceId,
          runId,
          runEventCreateSchema.parse(rest)
        )
        return event ? ok(event, "Event appended.") : fail("Run not found.")
      })
  )

  server.registerTool(
    "complete_run",
    {
      title: "Complete run",
      description:
        "Mark a run completed (optionally with a summary). A linked task moves to in_review.",
      inputSchema: { runId: z.string(), ...runCompleteSchema.shape },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { runId, ...rest } = args
        const run = await completeRun(
          ctx,
          workspaceId,
          runId,
          runCompleteSchema.parse(rest)
        )
        return run ? ok(run, `Run ${run.id} completed.`) : fail("Run not found.")
      })
  )

  server.registerTool(
    "fail_run",
    {
      title: "Fail run",
      description:
        "Mark a run failed (optionally with an error). A linked task moves to needs_changes.",
      inputSchema: { runId: z.string(), ...runFailSchema.shape },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { runId, ...rest } = args
        const run = await failRun(
          ctx,
          workspaceId,
          runId,
          runFailSchema.parse(rest)
        )
        return run ? ok(run, `Run ${run.id} failed.`) : fail("Run not found.")
      })
  )

  server.registerTool(
    "cancel_run",
    {
      title: "Cancel run",
      description: "Cancel a run.",
      inputSchema: { runId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const run = await cancelRun(ctx, workspaceId, args.runId)
        return run ? ok(run, `Run ${run.id} canceled.`) : fail("Run not found.")
      })
  )
}
