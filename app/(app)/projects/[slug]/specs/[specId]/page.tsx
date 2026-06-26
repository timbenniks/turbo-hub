import { notFound } from "next/navigation"

import { SpecDetail } from "@/components/spec-detail"
import { getSpec } from "@/lib/services/specs"
import { timeAsync } from "@/lib/timing"
import { loadProject } from "../../project-context"

export default async function SpecDetailPage({
  params,
}: {
  params: Promise<{ slug: string; specId: string }>
}) {
  return timeAsync("render.project.spec-detail", async () => {
  const { slug, specId } = await params
  const { workspaceId, project } = await loadProject(slug)
  const spec = await getSpec(workspaceId, specId)
  if (!spec || spec.projectId !== project.id) notFound()

  return <SpecDetail slug={slug} spec={spec} />
  })
}
