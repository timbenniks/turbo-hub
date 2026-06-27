import { getPublicOrigin } from "mcp-handler"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
} as const

export function GET(req: Request) {
  const origin = getPublicOrigin(req)

  return Response.json(
    {
      resource: `${origin}/api/mcp`,
      resource_name: "Turbo Hub MCP",
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp:read", "mcp:write"],
    },
    { headers: corsHeaders }
  )
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400",
    },
  })
}
