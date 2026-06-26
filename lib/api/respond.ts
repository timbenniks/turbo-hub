import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { AuthError } from "@/lib/auth/context"

/**
 * Wrap an API handler so AuthError → 401/403, ZodError → 400, anything else →
 * 500, all as typed JSON.
 */
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn()
    // Allow handlers to return a NextResponse directly (e.g. 404, 204).
    if (data instanceof NextResponse) return data
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: err.issues },
        { status: 400 }
      )
    }
    console.error("API error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 })
}
