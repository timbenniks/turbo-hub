import { ZodError } from "zod"

import { AuthError } from "@/lib/auth/context"

export type ToolResult = {
  content: { type: "text"; text: string }[]
  isError?: boolean
}

/** Successful result: optional summary line followed by pretty JSON. */
export function ok(value: unknown, summary?: string): ToolResult {
  const json = JSON.stringify(value, null, 2)
  return {
    content: [{ type: "text", text: summary ? `${summary}\n\n${json}` : json }],
  }
}

/** Error result the agent can read and act on. */
export function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true }
}

function errMessage(e: unknown): string {
  if (e instanceof ZodError) {
    return `Validation error:\n${JSON.stringify(e.issues, null, 2)}`
  }
  if (e instanceof AuthError) return e.message
  if (e instanceof Error) return e.message
  return String(e)
}

/** Run a tool body, turning any thrown error into a clean isError result. */
export async function handle(
  fn: () => Promise<ToolResult>
): Promise<ToolResult> {
  try {
    return await fn()
  } catch (e) {
    return fail(errMessage(e))
  }
}
