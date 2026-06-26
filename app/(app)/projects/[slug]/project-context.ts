import { cache } from "react"
import { notFound } from "next/navigation"

import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { getProjectBySlug, type ProjectWithTags } from "@/lib/services/projects"

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
    const ctx = await requirePrimaryWorkspace()
    const project = await getProjectBySlug(ctx.workspaceId, slug)
    if (!project) notFound()
    return { workspaceId: ctx.workspaceId, project }
  }
)
