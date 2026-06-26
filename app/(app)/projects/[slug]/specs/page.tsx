import { SpecsManager } from "@/components/specs-manager"
import { listSpecs } from "@/lib/services/specs"
import { loadProject } from "../project-context"

export default async function ProjectSpecsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { workspaceId, project } = await loadProject(slug)
  const specs = await listSpecs(workspaceId, project.id)

  return <SpecsManager slug={slug} projectId={project.id} specs={specs} />
}
