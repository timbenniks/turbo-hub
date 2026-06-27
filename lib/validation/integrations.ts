import { z } from "zod"

import { INTEGRATION_PROVIDERS, INTEGRATION_STATUSES } from "@/lib/enums"

export const integrationCreateSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  name: z.string().trim().min(1).max(120),
  status: z.enum(INTEGRATION_STATUSES).default("active"),
  config: z.record(z.string(), z.unknown()).default({}),
  secret: z.string().trim().min(1).max(10_000).optional(),
})

export type IntegrationCreateInput = z.infer<typeof integrationCreateSchema>
