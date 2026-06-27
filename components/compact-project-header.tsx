import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type Breadcrumb = {
  label: string
  href?: string
}

/**
 * Compact context header for project child pages. Replaces the large repeated
 * project header: a small breadcrumb, the current object title, and an inline
 * metadata line (chips/text) — no repeated project description.
 */
export function CompactProjectHeader({
  slug,
  projectName,
  crumbs = [],
  title,
  meta,
  actions,
  className,
}: {
  slug: string
  projectName: string
  crumbs?: Breadcrumb[]
  title: string
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  const trail: Breadcrumb[] = [
    { label: projectName, href: `/projects/${slug}` },
    ...crumbs,
  ]

  return (
    <div className={cn("space-y-2 border-b border-border pb-4", className)}>
      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {trail.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 opacity-60" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {meta && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
