import { z } from "zod"

import { API_KEY_SCOPES } from "@/lib/enums"

/** Normalize an allowlist: trim, drop blanks, dedupe. Empty → undefined (= no restriction). */
const allowlist = z
  .array(z.string().trim().min(1))
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return undefined
    const cleaned = [...new Set(v.map((s) => s.trim()).filter(Boolean))]
    return cleaned.length ? cleaned : undefined
  })

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1).default([...API_KEY_SCOPES]),
  // MCP allowlists — restrict an agent token to specific projects / tools.
  allowedProjectIds: allowlist,
  allowedToolNames: allowlist,
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
})

export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
