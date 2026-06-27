import { z } from "zod"

import { API_KEY_SCOPES } from "@/lib/enums"

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1).default([...API_KEY_SCOPES]),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
})

export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
