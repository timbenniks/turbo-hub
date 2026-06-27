import { PatternsManager } from "@/components/patterns-manager"
import { requirePrimaryWorkspace } from "@/lib/auth/context"
import { listPatterns } from "@/lib/services/patterns"
import { timeAsync } from "@/lib/timing"

export default async function PatternsPage() {
  return timeAsync("render.patterns", async () => {
    const ctx = await requirePrimaryWorkspace()
    const patterns = await listPatterns(ctx.workspaceId)

    return (
      <PatternsManager
        initial={patterns.map((p) => ({
          id: p.id,
          summary: p.summary,
          body: p.body,
          appliesTo: p.appliesTo,
          type: p.type,
          tags: p.tags,
          stack: p.stack,
          usageCount: p.usageCount,
        }))}
      />
    )
  })
}
