import { AuthError, requirePrimaryWorkspace } from "@/lib/auth/context"
import { getProjectById, type ProjectWithTags } from "@/lib/services/projects"

export type WorkspaceContext = Awaited<
  ReturnType<typeof requirePrimaryWorkspace>
>

/**
 * Resolve the auth/workspace context plus a project the user owns, or throw.
 * Used by every project-scoped route so the workspace + ownership check lives
 * in one place.
 */
export async function requireProject(
  projectId: string
): Promise<{ ctx: WorkspaceContext; project: ProjectWithTags }> {
  const ctx = await requirePrimaryWorkspace()
  const project = await getProjectById(ctx.workspaceId, projectId)
  if (!project) throw new AuthError("Project not found", 404)
  return { ctx, project }
}
