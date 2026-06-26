import { PlanManager } from "@/components/plan-manager"
import { listPlans } from "@/lib/services/plans"
import { loadProject } from "../project-context"

export default async function ProjectPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { workspaceId, project } = await loadProject(slug)
  const plans = await listPlans(workspaceId, project.id)

  return <PlanManager projectId={project.id} plans={plans} />
}
