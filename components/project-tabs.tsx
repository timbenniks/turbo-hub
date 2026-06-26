"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// Secondary project nav (spec §23.2). Enabled tabs are live; the rest land in
// later phases.
const TABS: { label: string; segment: string; enabled: boolean }[] = [
  { label: "Overview", segment: "", enabled: true },
  { label: "Plan", segment: "plan", enabled: true },
  { label: "Specs", segment: "specs", enabled: true },
  { label: "Tasks", segment: "tasks", enabled: true },
  { label: "Runs", segment: "runs", enabled: false },
  { label: "PRs", segment: "pull-requests", enabled: false },
  { label: "Decisions", segment: "decisions", enabled: false },
  { label: "Learnings", segment: "learnings", enabled: false },
  { label: "Patterns", segment: "patterns", enabled: false },
  { label: "Settings", segment: "settings", enabled: false },
]

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/projects/${slug}`

  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base
        const active = tab.enabled && pathname === href

        if (!tab.enabled) {
          return (
            <span
              key={tab.label}
              className="cursor-not-allowed px-3 py-1.5 text-sm text-muted-foreground/50"
              title="Coming in a later phase"
            >
              {tab.label}
            </span>
          )
        }

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "border-b-2 px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
