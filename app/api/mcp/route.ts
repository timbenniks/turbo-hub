import { createMcpHandler, experimental_withMcpAuth } from "mcp-handler"

import { verifyToken } from "@/lib/mcp/context"
import { registerProjectTools } from "@/lib/mcp/tools/projects"
import { registerPlanTools } from "@/lib/mcp/tools/plans"
import { registerSpecTools } from "@/lib/mcp/tools/specs"
import { registerTaskTools } from "@/lib/mcp/tools/tasks"
import { registerTagTools } from "@/lib/mcp/tools/tags"

export const maxDuration = 60

const handler = createMcpHandler(
  (server) => {
    registerProjectTools(server)
    registerPlanTools(server)
    registerSpecTools(server)
    registerTaskTools(server)
    registerTagTools(server)
  },
  { serverInfo: { name: "turbo-hub", version: "0.0.1" } },
  // Stateless streamable HTTP (no sessions/Redis); SSE is deprecated.
  { basePath: "/api", disableSse: true, maxDuration: 60 }
)

// Require a valid `thub_` bearer token on every request → resolves to a
// user + workspace, surfaced to tools via AuthInfo.extra.
const authed = experimental_withMcpAuth(handler, verifyToken, { required: true })

export { authed as GET, authed as POST }
