import { createMcpHandler, experimental_withMcpAuth } from "mcp-handler"

import { verifyToken } from "@/lib/mcp/context"
import { registerProjectTools } from "@/lib/mcp/tools/projects"
import { registerPlanTools } from "@/lib/mcp/tools/plans"
import { registerSpecTools } from "@/lib/mcp/tools/specs"
import { registerTaskTools } from "@/lib/mcp/tools/tasks"
import { registerTagTools } from "@/lib/mcp/tools/tags"
import { registerDecisionTools } from "@/lib/mcp/tools/decisions"
import { registerLearningTools } from "@/lib/mcp/tools/learnings"
import { registerPatternTools } from "@/lib/mcp/tools/patterns"
import { registerContextPackTools } from "@/lib/mcp/tools/context-packs"
import { registerSearchTools } from "@/lib/mcp/tools/search"
import { registerRunTools } from "@/lib/mcp/tools/runs"
import { registerPullRequestTools } from "@/lib/mcp/tools/pull-requests"
import { registerAgentProfileTools } from "@/lib/mcp/tools/agent-profiles"
import { registerRepositoryTools } from "@/lib/mcp/tools/repositories"
import { registerIntegrationTools } from "@/lib/mcp/tools/integrations"
import { registerMcpResources } from "@/lib/mcp/resources"
import { registerMcpPrompts } from "@/lib/mcp/prompts"

export const maxDuration = 60

const handler = createMcpHandler(
  (server) => {
    registerProjectTools(server)
    registerPlanTools(server)
    registerSpecTools(server)
    registerTaskTools(server)
    registerTagTools(server)
    registerDecisionTools(server)
    registerLearningTools(server)
    registerPatternTools(server)
    registerContextPackTools(server)
    registerSearchTools(server)
    registerRunTools(server)
    registerPullRequestTools(server)
    registerAgentProfileTools(server)
    registerRepositoryTools(server)
    registerIntegrationTools(server)
    registerMcpResources(server)
    registerMcpPrompts(server)
  },
  { serverInfo: { name: "turbo-hub", version: "0.0.1" } },
  // Stateless streamable HTTP (no sessions/Redis); SSE is deprecated.
  { basePath: "/api", disableSse: true, maxDuration: 60 }
)

// Require a valid `thub_` bearer token on every request → resolves to a
// user + workspace, surfaced to tools via AuthInfo.extra.
const authed = experimental_withMcpAuth(handler, verifyToken, {
  required: true,
  requiredScopes: ["mcp:read"],
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
} as const

async function withCors(req: Request) {
  const res = await authed(req)
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.headers.set(key, value)
  }
  return res
}

export { withCors as GET, withCors as POST }

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400",
    },
  })
}
