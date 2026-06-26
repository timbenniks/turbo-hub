import { SpecsManager } from "@/components/specs-manager"
import { listSpecs } from "@/lib/services/specs"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../project-context"

export default async function ProjectSpecsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.specs", async () => {
  const { slug } = await params
  const { workspaceId, project } = await loadProject(slug)
  const specs = await listSpecs(workspaceId, project.id)

  return <SpecsManager slug={slug} projectId={project.id} specs={specs} />
  })
}
