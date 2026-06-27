import { z } from "zod"

import { AGENT_PROFILE_TYPES } from "@/lib/enums"

const list = z.array(z.string().trim().min(1).max(60)).max(20)

export const agentProfileCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  type: z.enum(AGENT_PROFILE_TYPES).default("manual"),
  description: z.string().trim().max(2000).optional(),
  capabilities: list.optional(),
  defaultModel: z.string().trim().max(120).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

export const agentProfileUpdateSchema = agentProfileCreateSchema.partial()

export type AgentProfileCreateInput = z.infer<typeof agentProfileCreateSchema>
export type AgentProfileUpdateInput = z.infer<typeof agentProfileUpdateSchema>
