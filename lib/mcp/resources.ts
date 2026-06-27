import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js"

import { getContextPack, listContextPacks } from "@/lib/services/contextPacks"
import { listDecisions } from "@/lib/services/decisions"
import { listLearnings } from "@/lib/services/learnings"
import { listPatterns } from "@/lib/services/patterns"
import { getActivePlan, listPlans } from "@/lib/services/plans"
import { getProjectById, listProjects } from "@/lib/services/projects"
import { listPullRequests } from "@/lib/services/pullRequests"
import { getRun, listProjectRuns, listRunEvents, listTaskRuns } from "@/lib/services/runs"
import { listSpecs, specBody } from "@/lib/services/specs"
import { getTask, listDependencies, listTasks } from "@/lib/services/tasks"
import { labelize } from "@/lib/labels"
import { requireAuth, resolveProject } from "@/lib/mcp/context"

function textResource(
  uri: URL,
  text: string,
  mimeType = "text/markdown"
): ReadResourceResult {
  return {
    contents: [{ uri: uri.href, mimeType, text }],
  }
}

function jsonResource(uri: URL, value: unknown): ReadResourceResult {
  return textResource(uri, JSON.stringify(value, null, 2), "application/json")
}

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? "")
}

async function projectId(workspaceId: string, ref: string): Promise<string> {
  return resolveProject(workspaceId, decodeURIComponent(ref))
}

export function registerMcpResources(server: McpServer) {
  server.registerResource(
    "turbo_hub_help",
    "turbo-hub://help",
    {
      title: "Turbo Hub MCP help",
      description: "How to use this MCP server from an agent harness.",
      mimeType: "text/markdown",
    },
    async (uri) =>
      textResource(
        uri,
        [
          "# Turbo Hub MCP",
          "",
          "Use this server to read and write project planning state, context packs, manual agent runs, pull requests, decisions, learnings, and reusable patterns.",
          "",
          "Authentication: pass a `thub_` token as `Authorization: Bearer <token>`. The token needs `mcp:read` for resources/read tools and `mcp:write` for mutating tools.",
          "",
          "Common flow:",
          "1. Read `turbo-hub://workspace/overview` or call `list_projects`.",
          "2. Read `turbo-hub://project/{project}/overview`, then specs/tasks/memory resources.",
          "3. Assemble and approve a context pack for a task.",
          "4. Create/start a run, append events, link a PR, complete/fail the run.",
          "5. Capture learnings and promote reusable ones to patterns.",
        ].join("\n")
      )
  )

  server.registerResource(
    "workspace_overview",
    "turbo-hub://workspace/overview",
    {
      title: "Workspace overview",
      description: "Projects and reusable patterns for the authenticated workspace.",
      mimeType: "application/json",
    },
    async (uri, extra) => {
      const { workspaceId } = requireAuth(extra)
      const [projects, patterns] = await Promise.all([
        listProjects(workspaceId, { includeArchived: true }),
        listPatterns(workspaceId),
      ])
      return jsonResource(uri, { workspaceId, projects, patterns })
    }
  )

  const projectList = async (extra: Parameters<typeof requireAuth>[0]) => {
    const { workspaceId } = requireAuth(extra)
    const projects = await listProjects(workspaceId, { includeArchived: true })
    return {
      resources: projects.map((project) => ({
        uri: `turbo-hub://project/${encodeURIComponent(project.slug)}/overview`,
        name: `project:${project.slug}:overview`,
        title: `${project.name} overview`,
        mimeType: "application/json",
      })),
    }
  }

  server.registerResource(
    "project_overview",
    new ResourceTemplate("turbo-hub://project/{project}/overview", {
      list: projectList,
    }),
    {
      title: "Project overview",
      description: "One project by id, slug, or exact name.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      const [project, activePlan, specs, tasks, decisions, learnings, runs, pullRequests] =
        await Promise.all([
          getProjectById(workspaceId, id),
          getActivePlan(workspaceId, id),
          listSpecs(workspaceId, id),
          listTasks(workspaceId, id),
          listDecisions(workspaceId, id),
          listLearnings(workspaceId, id),
          listProjectRuns(workspaceId, id),
          listPullRequests(workspaceId, id),
        ])
      return jsonResource(uri, {
        project,
        activePlan,
        counts: {
          specs: specs.length,
          tasks: tasks.length,
          decisions: decisions.length,
          learnings: learnings.length,
          runs: runs.length,
          pullRequests: pullRequests.length,
        },
      })
    }
  )

  server.registerResource(
    "project_plan",
    new ResourceTemplate("turbo-hub://project/{project}/plan", { list: undefined }),
    {
      title: "Project plan",
      description: "Active plan and plan history for a project.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      const [activePlan, plans] = await Promise.all([
        getActivePlan(workspaceId, id),
        listPlans(workspaceId, id),
      ])
      return jsonResource(uri, { activePlan, plans })
    }
  )

  server.registerResource(
    "project_specs",
    new ResourceTemplate("turbo-hub://project/{project}/specs", { list: undefined }),
    {
      title: "Project specs",
      description: "Specs for a project, including assembled Markdown bodies.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      const specs = await listSpecs(workspaceId, id)
      return jsonResource(
        uri,
        specs.map((spec) => ({ ...spec, body: specBody(spec) }))
      )
    }
  )

  server.registerResource(
    "project_tasks",
    new ResourceTemplate("turbo-hub://project/{project}/tasks", { list: undefined }),
    {
      title: "Project tasks",
      description: "Tasks for a project.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      return jsonResource(uri, await listTasks(workspaceId, id))
    }
  )

  server.registerResource(
    "project_memory",
    new ResourceTemplate("turbo-hub://project/{project}/memory", { list: undefined }),
    {
      title: "Project memory",
      description: "Decisions and learnings for a project.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      const [decisions, learnings] = await Promise.all([
        listDecisions(workspaceId, id),
        listLearnings(workspaceId, id),
      ])
      return jsonResource(uri, { decisions, learnings })
    }
  )

  server.registerResource(
    "project_runs",
    new ResourceTemplate("turbo-hub://project/{project}/runs", { list: undefined }),
    {
      title: "Project runs",
      description: "Manual or external agent runs for a project.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      return jsonResource(uri, await listProjectRuns(workspaceId, id))
    }
  )

  server.registerResource(
    "project_pull_requests",
    new ResourceTemplate("turbo-hub://project/{project}/pull-requests", {
      list: undefined,
    }),
    {
      title: "Project pull requests",
      description: "Pull requests linked to a project.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const id = await projectId(workspaceId, single(variables.project))
      return jsonResource(uri, await listPullRequests(workspaceId, id))
    }
  )

  server.registerResource(
    "task_execution_brief",
    new ResourceTemplate("turbo-hub://task/{taskId}/execution-brief", {
      list: undefined,
    }),
    {
      title: "Task execution brief",
      description: "Task details, dependencies, context packs, and runs.",
      mimeType: "text/markdown",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const taskId = single(variables.taskId)
      const task = await getTask(workspaceId, taskId)
      if (!task) throw new Error("Task not found.")
      const [dependencies, contextPacks, runs] = await Promise.all([
        listDependencies(workspaceId, taskId),
        listContextPacks(workspaceId, taskId),
        listTaskRuns(workspaceId, taskId),
      ])
      return textResource(
        uri,
        [
          `# ${task.title}`,
          "",
          `Status: ${labelize(task.status)}`,
          `Priority: ${labelize(task.priority)}`,
          task.description ? `\n## Description\n${task.description}` : "",
          task.acceptanceCriteria
            ? `\n## Acceptance Criteria\n${task.acceptanceCriteria}`
            : "",
          task.contextNotes ? `\n## Context Notes\n${task.contextNotes}` : "",
          `\n## Dependencies\n${JSON.stringify(dependencies, null, 2)}`,
          `\n## Context Packs\n${JSON.stringify(contextPacks, null, 2)}`,
          `\n## Runs\n${JSON.stringify(runs, null, 2)}`,
        ]
          .filter(Boolean)
          .join("\n")
      )
    }
  )

  server.registerResource(
    "task_context_packs",
    new ResourceTemplate("turbo-hub://task/{taskId}/context-packs", {
      list: undefined,
    }),
    {
      title: "Task context packs",
      description: "Context packs assembled for a task.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      return jsonResource(uri, await listContextPacks(workspaceId, single(variables.taskId)))
    }
  )

  server.registerResource(
    "context_pack",
    new ResourceTemplate("turbo-hub://context-pack/{packId}", {
      list: undefined,
    }),
    {
      title: "Context pack",
      description: "One assembled context pack.",
      mimeType: "text/markdown",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const pack = await getContextPack(workspaceId, single(variables.packId))
      if (!pack) throw new Error("Context pack not found.")
      return textResource(uri, pack.body)
    }
  )

  server.registerResource(
    "run_status",
    new ResourceTemplate("turbo-hub://run/{runId}/status", { list: undefined }),
    {
      title: "Run status",
      description: "A run with its append-only event timeline.",
      mimeType: "application/json",
    },
    async (uri, variables, extra) => {
      const { workspaceId } = requireAuth(extra)
      const runId = single(variables.runId)
      const run = await getRun(workspaceId, runId)
      if (!run) throw new Error("Run not found.")
      const events = await listRunEvents(workspaceId, runId)
      return jsonResource(uri, { ...run, events })
    }
  )

  server.registerResource(
    "pattern_library",
    "turbo-hub://patterns",
    {
      title: "Pattern library",
      description: "Reusable workspace patterns.",
      mimeType: "application/json",
    },
    async (uri, extra) => {
      const { workspaceId } = requireAuth(extra)
      return jsonResource(uri, await listPatterns(workspaceId))
    }
  )
}
