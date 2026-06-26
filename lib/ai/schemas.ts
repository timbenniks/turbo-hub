import { z } from "zod"

import { PROJECT_PRIORITIES, RUNNER_PREFERENCES } from "@/lib/enums"

// Structured output schemas for AI generation (spec §22.2). The model is forced
// to return these shapes; services serialize them into Markdown rows.

export const planGenSchema = z.object({
  title: z.string().describe("Short plan title"),
  summary: z.string().describe("1-2 paragraph product summary"),
  goals: z.array(z.string()).describe("Concrete goals"),
  nonGoals: z.array(z.string()).describe("Explicitly out of scope"),
  constraints: z.array(z.string()).describe("Technical or product constraints"),
  milestones: z
    .array(z.string())
    .describe("Suggested milestones, in rough order"),
  openQuestions: z.array(z.string()).describe("Unresolved questions"),
})

export const specGenSchema = z.object({
  title: z.string(),
  summary: z.string(),
  problem: z.string(),
  goal: z.string(),
  scope: z.string(),
  nonGoals: z.array(z.string()),
  userStories: z.array(z.string()),
  uxRequirements: z.array(z.string()),
  dataRequirements: z.array(z.string()),
  apiRequirements: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  risks: z.array(z.string()),
  implementationNotes: z.string(),
})

export const taskGenSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(PROJECT_PRIORITIES).default("medium"),
        runnerPreference: z.enum(RUNNER_PREFERENCES).default("manual"),
        acceptanceCriteria: z
          .array(z.string())
          .describe("Bullet-point acceptance criteria"),
      })
    )
    .describe("Agent-executable tasks, each small and independently shippable"),
})

export type PlanGen = z.infer<typeof planGenSchema>
export type SpecGen = z.infer<typeof specGenSchema>
export type TaskGen = z.infer<typeof taskGenSchema>
