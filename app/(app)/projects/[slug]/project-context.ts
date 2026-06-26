import { cache } from "react"
import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth/context"
import {
  getProjectBySlugForUser,
  type ProjectWithTags,
} from "@/lib/services/projects"

export type LoadedProject = {
  workspaceId: string
  project: ProjectWithTags
}

/**
 * Resolve the project for a slug once per request. Shared by the project layout
 * and every tab page so they don't each re-query.
 */
export const loadProject = cache(
  async (slug: string): Promise<LoadedProject> => {
    const ctx = await requireUser()
    const project = await getProjectBySlugForUser(ctx.userId, slug)
    if (!project) notFound()
    return { workspaceId: project.workspaceId, project }
  }
)
