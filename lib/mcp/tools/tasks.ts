import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  addDependency,
  createTask,
  getTask,
  listDependencies,
  listTasks,
  updateTask,
} from "@/lib/services/tasks"
import {
  taskCreateSchema,
  taskDependencyCreateSchema,
  taskListFiltersSchema,
  taskUpdateSchema,
} from "@/lib/validation/tasks"
import { requireAuth, requireWriteAuth, resolveProject } from "@/lib/mcp/context"
import { fail, handle, ok } from "@/lib/mcp/format"

const projectRef = z.string().describe("Project id, slug, or exact name")

export function registerTaskTools(server: McpServer) {
  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description: "List tasks for a project, optionally filtered by status or spec.",
      inputSchema: { project: projectRef, ...taskListFiltersSchema.shape },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const rows = await listTasks(
          workspaceId,
          id,
          taskListFiltersSchema.parse(rest)
        )
        return ok(rows, `${rows.length} task(s).`)
      })
  )

  server.registerTool(
    "create_task",
    {
      title: "Create task",
      description: "Create a task in a project. Only `title` is required.",
      inputSchema: { project: projectRef, ...taskCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { project, ...rest } = args
        const id = await resolveProject(workspaceId, project)
        const task = await createTask(
          ctx,
          workspaceId,
          id,
          taskCreateSchema.parse(rest)
        )
        return ok(task, `Created task "${task.title}" (id ${task.id}).`)
      })
  )

  server.registerTool(
    "get_task",
    {
      title: "Get task",
      description: "Fetch one task by its id.",
      inputSchema: { taskId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const task = await getTask(workspaceId, args.taskId)
        return task ? ok(task) : fail("Task not found.")
      })
  )

  server.registerTool(
    "update_task",
    {
      title: "Update task",
      description:
        "Update fields on a task by its id. Setting status to `done` stamps completion.",
      inputSchema: { taskId: z.string(), ...taskUpdateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { taskId, ...rest } = args
        const task = await updateTask(
          ctx,
          workspaceId,
          taskId,
          taskUpdateSchema.parse(rest)
        )
        return task ? ok(task, `Updated task "${task.title}".`) : fail("Task not found.")
      })
  )

  server.registerTool(
    "list_task_dependencies",
    {
      title: "List task dependencies",
      description: "List the dependencies declared on a task.",
      inputSchema: { taskId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { workspaceId } = requireAuth(extra)
        const rows = await listDependencies(workspaceId, args.taskId)
        return ok(rows, `${rows.length} dependency(ies).`)
      })
  )

  server.registerTool(
    "add_task_dependency",
    {
      title: "Add task dependency",
      description: "Declare that a task depends on another task.",
      inputSchema: { taskId: z.string(), ...taskDependencyCreateSchema.shape },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    (args, extra) =>
      handle(async () => {
        const { ctx, workspaceId } = requireWriteAuth(extra)
        const { taskId, ...rest } = args
        const task = await getTask(workspaceId, taskId)
        if (!task) return fail("Task not found.")
        const dep = await addDependency(
          ctx,
          workspaceId,
          task.projectId,
          taskId,
          taskDependencyCreateSchema.parse(rest)
        )
        return dep
          ? ok(dep, `Added dependency on ${rest.dependsOnTaskId}.`)
          : fail("Could not add dependency.")
      })
  )
}
