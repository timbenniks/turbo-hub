import { z } from "zod"

import {
  PROJECT_HEALTHS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from "@/lib/enums"

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).default("idea"),
  health: z.enum(PROJECT_HEALTHS).default("unknown"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  type: z.enum(PROJECT_TYPES).default("app"),
  stack: z.array(z.string().trim().min(1)).max(30).default([]),
  goal: z.string().trim().max(2000).optional(),
  constraints: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(4000).optional(),
  tagIds: z.array(z.string()).max(50).default([]),
})

export const projectUpdateSchema = projectCreateSchema.partial()

export const projectListFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  tagId: z.string().optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
})

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type ProjectListFilters = z.infer<typeof projectListFiltersSchema>
