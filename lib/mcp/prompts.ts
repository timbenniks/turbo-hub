import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerMcpPrompts(server: McpServer) {
  server.registerPrompt(
    "work_on_task",
    {
      title: "Work on a Turbo Hub task",
      description:
        "Guide an agent through reading task context, running work, and recording the result.",
      argsSchema: {
        taskId: z.string().describe("Turbo Hub task id"),
      },
    },
    ({ taskId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Work on Turbo Hub task ${taskId}.`,
              "",
              "Use the MCP server as the source of truth:",
              `1. Read turbo-hub://task/${taskId}/execution-brief.`,
              "2. If no approved/sent context pack exists, call assemble_context_pack or generate_context_pack, then approve it when ready.",
              "3. Call create_run and start_run before implementation work.",
              "4. Append meaningful run events as you make progress.",
              "5. Link a pull request when available.",
              "6. Complete or fail the run with a concise summary.",
              "7. Capture any reusable learning with create_learning, then promote it if it should become a pattern.",
            ].join("\n"),
          },
        },
      ],
    })
  )

  server.registerPrompt(
    "review_project_status",
    {
      title: "Review project status",
      description:
        "Summarize a project from its plan, specs, tasks, memory, runs, and PRs.",
      argsSchema: {
        project: z.string().describe("Project id, slug, or exact name"),
      },
    },
    ({ project }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Review Turbo Hub project ${project}.`,
              "",
              "Read these resources before answering:",
              `- turbo-hub://project/${encodeURIComponent(project)}/overview`,
              `- turbo-hub://project/${encodeURIComponent(project)}/plan`,
              `- turbo-hub://project/${encodeURIComponent(project)}/specs`,
              `- turbo-hub://project/${encodeURIComponent(project)}/tasks`,
              `- turbo-hub://project/${encodeURIComponent(project)}/memory`,
              `- turbo-hub://project/${encodeURIComponent(project)}/runs`,
              `- turbo-hub://project/${encodeURIComponent(project)}/pull-requests`,
              "",
              "Then summarize: current state, active risks, blocked work, useful decisions/learnings, and the next three actions.",
            ].join("\n"),
          },
        },
      ],
    })
  )
}
