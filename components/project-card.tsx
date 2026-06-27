import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { StatusChip } from "@/components/ui/status-chip"
import { labelize } from "@/lib/labels"
import type { ProjectWithTags } from "@/lib/services/projects"

export function ProjectCard({ project }: { project: ProjectWithTags }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      prefetch
      className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {project.name}
        </h3>
        <span className="font-mono text-xs text-muted-foreground capitalize">
          {project.type.replace(/_/g, " ")}
        </span>
      </div>
      {project.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
        <StatusChip value={project.status} />
        {project.health !== "unknown" && (
          <StatusChip value={project.health} prefix="Health" />
        )}
        {project.tags.map((t) => (
          <Badge key={t.id} variant="outline" className="text-xs">
            {labelize(t.name)}
          </Badge>
        ))}
      </div>
    </Link>
  )
}
