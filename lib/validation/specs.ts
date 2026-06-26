import { z } from "zod"

const md = z.string().trim().max(8000)

export const specCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  planId: z.string().optional(),
  summary: md.optional(),
  problem: md.optional(),
  goal: md.optional(),
  scope: md.optional(),
  nonGoals: md.optional(),
  userStories: md.optional(),
  uxRequirements: md.optional(),
  dataRequirements: md.optional(),
  apiRequirements: md.optional(),
  acceptanceCriteria: md.optional(),
  risks: md.optional(),
  implementationNotes: md.optional(),
})

export const specUpdateSchema = specCreateSchema.partial()

export const specGenerateSchema = z.object({
  instruction: z.string().trim().min(1, "Describe the spec focus").max(4000),
  planId: z.string().optional(),
})

export type SpecCreateInput = z.infer<typeof specCreateSchema>
export type SpecUpdateInput = z.infer<typeof specUpdateSchema>
export type SpecGenerateInput = z.infer<typeof specGenerateSchema>
