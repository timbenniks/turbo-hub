import { LearningsManager } from "@/components/learnings-manager"
import { listLearnings } from "@/lib/services/learnings"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../project-context"

export default async function ProjectLearningsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.learnings", async () => {
    const { slug } = await params
    const { workspaceId, project } = await loadProject(slug)
    const learnings = await listLearnings(workspaceId, project.id)

    return <LearningsManager projectId={project.id} learnings={learnings} />
  })
}
