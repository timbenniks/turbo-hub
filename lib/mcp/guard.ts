import { createHash } from "node:crypto"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { recordActivity } from "@/lib/services/activity"
import { mcpAuth, resolveProject, type McpAuthExtra } from "@/lib/mcp/context"
import { fail, type ToolResult } from "@/lib/mcp/format"

// In-memory limiter/idempotency cache. Per serverless instance (not shared
// across regions), so this is a best-effort safety net against runaway or
// duplicated agent calls, not a distributed quota.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 120 // calls per token per minute
const IDEMPOTENCY_TTL_MS = 15_000 // coalesce identical repeat writes

const rateBuckets = new Map<string, { count: number; resetAt: number }>()
const idempotency = new Map<string, { at: number; result: ToolResult }>()

// Arg keys safe to record in the audit trail — never log secrets/free-form bodies.
const SAFE_ARG_KEYS = [
  "project",
  "taskId",
  "specId",
  "planId",
  "runId",
  "status",
  "title",
] as const

type ToolConfig = { annotations?: { readOnlyHint?: boolean } }
type ToolHandler = (
  args: Record<string, unknown>,
  extra: { authInfo?: unknown }
) => Promise<ToolResult> | ToolResult

function checkRate(tokenId: string): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(tokenId)
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(tokenId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (bucket.count >= RATE_MAX) return false
  bucket.count += 1
  return true
}

function idempotencyKey(
  tokenId: string,
  tool: string,
  args: Record<string, unknown>
): string {
  const hash = createHash("sha256")
    .update(`${tokenId}:${tool}:${JSON.stringify(args)}`)
    .digest("hex")
  return hash
}

function safeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of SAFE_ARG_KEYS) {
    if (args[key] !== undefined) out[key] = args[key]
  }
  return out
}

/**
 * Central enforcement for every MCP tool call. Wraps each registered handler so
 * the safety chain (spec §16.4) runs in one place rather than per-tool:
 * auth → tool allowlist → write scope → rate limit → project allowlist →
 * idempotency → run → audit.
 */
async function guard(
  toolName: string,
  config: ToolConfig,
  args: Record<string, unknown>,
  extra: { authInfo?: unknown },
  run: () => Promise<ToolResult> | ToolResult
): Promise<ToolResult> {
  const auth: McpAuthExtra | null = mcpAuth(extra as { authInfo?: undefined })
  if (!auth) return fail("Not authenticated.")

  const isWrite = config.annotations?.readOnlyHint !== true

  // Tool allowlist.
  if (auth.allowedToolNames?.length && !auth.allowedToolNames.includes(toolName)) {
    return fail(`Tool "${toolName}" is not permitted by this token.`)
  }

  // Read-only tokens (no mcp:write) cannot call write tools.
  if (isWrite && !auth.scopes.includes("mcp:write")) {
    return fail("This token is read-only (missing mcp:write scope).")
  }

  // Rate limit.
  if (!checkRate(auth.tokenId)) {
    return fail("Rate limit exceeded. Slow down and retry shortly.")
  }

  // Project allowlist + audit project linkage. Only resolve when something needs
  // it (an allowlist to enforce, or a write to audit) — keeps hot reads cheap.
  let projectId: string | null = null
  const hasProjectArg = typeof args.project === "string" && args.project
  const needsProject = hasProjectArg && (auth.allowedProjectIds?.length || isWrite)
  if (needsProject) {
    try {
      projectId = await resolveProject(auth.workspaceId, args.project as string)
    } catch {
      projectId = null
    }
    if (
      auth.allowedProjectIds?.length &&
      (!projectId || !auth.allowedProjectIds.includes(projectId))
    ) {
      return fail(`This token is not permitted to access project "${args.project}".`)
    }
  }

  // Idempotency: coalesce identical repeated writes within a short window.
  const idemKey = isWrite ? idempotencyKey(auth.tokenId, toolName, args) : null
  if (idemKey) {
    const cached = idempotency.get(idemKey)
    if (cached && Date.now() - cached.at < IDEMPOTENCY_TTL_MS) {
      return cached.result
    }
  }

  const result = await run()

  // Audit + cache successful writes only.
  if (isWrite && !result.isError) {
    if (idemKey) idempotency.set(idemKey, { at: Date.now(), result })
    await recordActivity({
      workspaceId: auth.workspaceId,
      projectId,
      actorType: "agent",
      actorId: auth.tokenId,
      type: `mcp.${toolName}`,
      title: `Agent called ${toolName}`,
      metadata: { tool: toolName, tokenId: auth.tokenId, args: safeArgs(args) },
    })
  }

  return result
}

/**
 * Monkeypatch `server.registerTool` so every tool registered afterwards is
 * wrapped by {@link guard}. Call once on the server before registering tools.
 */
export function guardServer(server: McpServer): void {
  const original = server.registerTool.bind(server) as (
    name: string,
    config: ToolConfig,
    handler: ToolHandler
  ) => unknown

  server.registerTool = ((name: string, config: ToolConfig, handler: ToolHandler) =>
    original(name, config, (args, extra) =>
      guard(name, config, args ?? {}, extra, () => handler(args, extra))
    )) as typeof server.registerTool
}
