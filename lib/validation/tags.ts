import { z } from "zod"

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color")
    .optional(),
})

export const tagUpdateSchema = tagCreateSchema.partial()

export type TagCreateInput = z.infer<typeof tagCreateSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
