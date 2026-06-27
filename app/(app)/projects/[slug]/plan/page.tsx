import { PlanManager } from "@/components/plan-manager"
import { listPlans } from "@/lib/services/plans"
import { listSpecs } from "@/lib/services/specs"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../project-context"

export default async function ProjectPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return timeAsync("render.project.plan", async () => {
    const { slug } = await params
    const { workspaceId, project } = await loadProject(slug)
    const [plans, specs] = await Promise.all([
      listPlans(workspaceId, project.id),
      listSpecs(workspaceId, project.id),
    ])

    return (
      <PlanManager
        slug={slug}
        projectId={project.id}
        project={{
          name: project.name,
          description: project.description,
          type: project.type,
          stack: project.stack,
          goal: project.goal,
          constraints: project.constraints,
        }}
        plans={plans}
        specs={specs.map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          planId: s.planId,
        }))}
      />
    )
  })
}
