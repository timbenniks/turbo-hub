import { z } from "zod"

import { DECISION_STATUSES, DECISION_TYPES } from "@/lib/enums"

const md = z.string().trim().max(8000)

export const decisionCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: md.optional(),
  type: z.enum(DECISION_TYPES).default("other"),
  status: z.enum(DECISION_STATUSES).default("proposed"),
  taskId: z.string().optional(),
  runId: z.string().optional(),
})

export const decisionUpdateSchema = decisionCreateSchema.partial()

export type DecisionCreateInput = z.infer<typeof decisionCreateSchema>
export type DecisionUpdateInput = z.infer<typeof decisionUpdateSchema>
