import { z } from "zod"

import { PULL_REQUEST_STATES } from "@/lib/enums"

export const pullRequestCreateSchema = z.object({
  taskId: z.string().optional(),
  runId: z.string().optional(),
  provider: z.string().trim().max(40).default("github"),
  externalId: z.string().trim().max(200).optional(),
  number: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Title is required").max(300),
  url: z.string().trim().url().max(500).optional(),
  state: z.enum(PULL_REQUEST_STATES).default("open"),
  author: z.string().trim().max(200).optional(),
  branch: z.string().trim().max(200).optional(),
  baseBranch: z.string().trim().max(200).optional(),
})

export const pullRequestUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  url: z.string().trim().url().max(500).optional(),
  state: z.enum(PULL_REQUEST_STATES).optional(),
  number: z.number().int().positive().optional(),
  branch: z.string().trim().max(200).optional(),
  baseBranch: z.string().trim().max(200).optional(),
})

export type PullRequestCreateInput = z.infer<typeof pullRequestCreateSchema>
export type PullRequestUpdateInput = z.infer<typeof pullRequestUpdateSchema>
