import { z } from "zod"

const md = z.string().trim().max(8000)

export const planCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  // Free-form pasted plan (e.g. from an external chat). Larger cap than the
  // structured fields — a full pasted planning doc easily exceeds 20k chars.
  body: z.string().trim().max(100000).optional(),
  summary: md.optional(),
  goals: md.optional(),
  nonGoals: md.optional(),
  constraints: md.optional(),
  milestones: md.optional(),
  openQuestions: md.optional(),
})

export const planUpdateSchema = planCreateSchema.partial()

export const planGenerateSchema = z.object({
  idea: z.string().trim().min(1, "Describe what you want to build").max(4000),
})

export type PlanCreateInput = z.infer<typeof planCreateSchema>
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>
export type PlanGenerateInput = z.infer<typeof planGenerateSchema>
