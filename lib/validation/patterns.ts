import { z } from "zod"

const md = z.string().trim().max(8000)
const tagList = z.array(z.string().trim().min(1).max(40)).max(20)

export const patternCreateSchema = z.object({
  summary: z.string().trim().min(1, "Summary is required").max(300),
  body: md.optional(),
  appliesTo: md.optional(),
  // Free-form category (often mirrors a learning type).
  type: z.string().trim().max(40).optional(),
  tags: tagList.optional(),
  stack: tagList.optional(),
  sourceProjectId: z.string().optional(),
  sourceTaskId: z.string().optional(),
  sourceLearningId: z.string().optional(),
  sourceRunId: z.string().optional(),
})

export const patternUpdateSchema = patternCreateSchema.partial()

export const patternSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  tags: tagList.optional(),
  stack: tagList.optional(),
  type: z.string().trim().max(40).optional(),
  sourceProjectId: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
})

export type PatternCreateInput = z.infer<typeof patternCreateSchema>
export type PatternUpdateInput = z.infer<typeof patternUpdateSchema>
export type PatternSearchInput = z.infer<typeof patternSearchSchema>
