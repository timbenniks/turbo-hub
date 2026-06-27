import { DecisionsManager } from "@/components/decisions-manager"
import { listDecisions } from "@/lib/services/decisions"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../project-context"

export default async function ProjectDecisionsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.decisions", async () => {
    const { slug } = await params
    const { workspaceId, project } = await loadProject(slug)
    const decisions = await listDecisions(workspaceId, project.id)

    return <DecisionsManager projectId={project.id} decisions={decisions} />
  })
}
