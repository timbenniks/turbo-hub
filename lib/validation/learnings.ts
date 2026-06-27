import { z } from "zod"

import { LEARNING_TYPES } from "@/lib/enums"

const md = z.string().trim().max(8000)
const tagList = z.array(z.string().trim().min(1).max(40)).max(20)

export const learningCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: md.optional(),
  type: z.enum(LEARNING_TYPES).default("gotcha"),
  // 0-100 self-reported confidence.
  confidence: z.number().int().min(0).max(100).optional(),
  tags: tagList.optional(),
  stack: tagList.optional(),
  taskId: z.string().optional(),
  runId: z.string().optional(),
})

export const learningUpdateSchema = learningCreateSchema.partial()

export type LearningCreateInput = z.infer<typeof learningCreateSchema>
export type LearningUpdateInput = z.infer<typeof learningUpdateSchema>
