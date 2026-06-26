"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import type { ProjectWithTags } from "@/lib/services/projects"

type TagOption = { id: string; name: string; color: string | null }

export function ProjectActions({
  project,
  tags = [],
}: {
  project: ProjectWithTags
  tags?: TagOption[]
}) {
  const router = useRouter()
  const [archiving, setArchiving] = React.useState(false)
  const isArchived = Boolean(project.archivedAt)

  async function archive() {
    if (!confirm(`Archive "${project.name}"? It can be restored later.`)) return
    setArchiving(true)
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
    setArchiving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? "Failed to archive")
      return
    }
    toast.success("Project archived")
    router.push("/projects")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <ProjectFormDialog
        tags={tags}
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          type: project.type,
          stack: project.stack,
          goal: project.goal,
          constraints: project.constraints,
          notes: project.notes,
          tags: project.tags,
        }}
        trigger={
          <Button variant="outline">
            <Pencil />
            Edit
          </Button>
        }
      />
      {!isArchived && (
        <Button variant="destructive" onClick={archive} disabled={archiving}>
          {archiving ? "Archiving…" : "Archive"}
        </Button>
      )}
    </div>
  )
}
