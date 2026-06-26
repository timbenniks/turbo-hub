import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { labelize } from "@/lib/labels"
import type { ProjectWithTags } from "@/lib/services/projects"

export function ProjectCard({ project }: { project: ProjectWithTags }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground">{project.name}</h3>
        <Badge variant="secondary" className="shrink-0">
          {labelize(project.status)}
        </Badge>
      </div>
      {project.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className="font-mono text-xs text-muted-foreground capitalize">
          {project.type.replace(/_/g, " ")}
        </span>
        {project.tags.map((t) => (
          <Badge key={t.id} variant="outline" className="text-xs">
            {t.name}
          </Badge>
        ))}
      </div>
    </Link>
  )
}
