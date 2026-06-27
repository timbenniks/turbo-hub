import { z } from "zod"

import { PULL_REQUEST_STATES } from "@/lib/enums"

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(max).optional()
  )

export const pullRequestCreateSchema = z.object({
  taskId: optionalText(120),
  runId: optionalText(120),
  provider: z.string().trim().max(40).default("github"),
  externalId: optionalText(200),
  number: z.number().int().positive().optional(),
  title: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().min(1).max(300).optional()
  ),
  url: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().url().max(500).optional()
  ),
  state: z.enum(PULL_REQUEST_STATES).default("open"),
  author: optionalText(200),
  branch: optionalText(200),
  baseBranch: optionalText(200),
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
