import { z } from "zod"

import { AGENT_RUN_EVENT_TYPES, AGENT_RUN_STATUSES } from "@/lib/enums"

const md = z.string().trim().max(8000)
const metadata = z.record(z.string(), z.unknown()).optional()

export const runCreateSchema = z.object({
  taskId: z.string().optional(),
  profileId: z.string().optional(),
  runnerType: z.string().trim().max(40).default("manual"),
  prompt: z.string().trim().max(20000).optional(),
  contextPackId: z.string().optional(),
  branchName: z.string().trim().max(200).optional(),
})

export const runUpdateSchema = z.object({
  status: z.enum(AGENT_RUN_STATUSES).optional(),
  summary: md.optional(),
  error: md.optional(),
  branchName: z.string().trim().max(200).optional(),
})

export const runEventCreateSchema = z.object({
  type: z.enum(AGENT_RUN_EVENT_TYPES),
  title: z.string().trim().min(1, "Title is required").max(300),
  body: md.optional(),
  metadata,
})

export const runCompleteSchema = z.object({
  summary: md.optional(),
})

export const runFailSchema = z.object({
  error: md.optional(),
})

export type RunCreateInput = z.infer<typeof runCreateSchema>
export type RunUpdateInput = z.infer<typeof runUpdateSchema>
export type RunEventCreateInput = z.infer<typeof runEventCreateSchema>
export type RunCompleteInput = z.infer<typeof runCompleteSchema>
export type RunFailInput = z.infer<typeof runFailSchema>
