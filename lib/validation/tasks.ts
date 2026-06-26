import { z } from "zod"

import {
  PROJECT_PRIORITIES,
  RUNNER_PREFERENCES,
  TASK_ASSIGNEE_TYPES,
  TASK_DEPENDENCY_TYPES,
  TASK_STATUSES,
} from "@/lib/enums"

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(8000).optional(),
  status: z.enum(TASK_STATUSES).default("backlog"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  assigneeType: z.enum(TASK_ASSIGNEE_TYPES).default("unassigned"),
  runnerPreference: z.enum(RUNNER_PREFERENCES).default("manual"),
  acceptanceCriteria: z.string().trim().max(8000).optional(),
  contextNotes: z.string().trim().max(8000).optional(),
  specId: z.string().optional(),
  parentTaskId: z.string().optional(),
})

export const taskUpdateSchema = taskCreateSchema.partial()

export const taskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
})

export const taskDependencyCreateSchema = z.object({
  dependsOnTaskId: z.string().min(1),
  type: z.enum(TASK_DEPENDENCY_TYPES).default("blocks"),
})

export const taskListFiltersSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  specId: z.string().optional(),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type TaskDependencyCreateInput = z.infer<
  typeof taskDependencyCreateSchema
>
export type TaskListFilters = z.infer<typeof taskListFiltersSchema>
