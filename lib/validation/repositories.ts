import { z } from "zod"

import { REPOSITORY_PROVIDERS } from "@/lib/enums"

export const repositoryCreateSchema = z.object({
  provider: z.enum(REPOSITORY_PROVIDERS).default("github"),
  owner: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url().max(500).optional(),
  defaultBranch: z.string().trim().min(1).max(120).default("main"),
  githubInstallationId: z.string().trim().max(200).optional(),
})

export const projectRepositoryLinkSchema = z.object({
  repositoryId: z.string().trim().optional(),
  url: z.string().trim().url().max(500).optional(),
  owner: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  defaultBranch: z.string().trim().min(1).max(120).default("main"),
})

export type RepositoryCreateInput = z.infer<typeof repositoryCreateSchema>
export type ProjectRepositoryLinkInput = z.infer<
  typeof projectRepositoryLinkSchema
>
