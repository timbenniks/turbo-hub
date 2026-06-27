import { z } from "zod"

export const contextPackAssembleSchema = z.object({
  // Optional title override; defaults to "Context pack — <task title>".
  title: z.string().trim().max(200).optional(),
})

export type ContextPackAssembleInput = z.infer<
  typeof contextPackAssembleSchema
>

export const contextPackGenerateSchema = contextPackAssembleSchema
export type ContextPackGenerateInput = ContextPackAssembleInput
