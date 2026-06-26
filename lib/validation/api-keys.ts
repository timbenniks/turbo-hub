import { z } from "zod"

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
})

export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
