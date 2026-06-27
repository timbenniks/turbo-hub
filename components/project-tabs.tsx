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
  { label: "Runs", segment: "runs", enabled: true },
  { label: "PRs", segment: "pull-requests", enabled: true },
  { label: "Decisions", segment: "decisions", enabled: true },
  { label: "Learnings", segment: "learnings", enabled: true },
  { label: "Settings", segment: "settings", enabled: false },
]

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/projects/${slug}`

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-2 lg:sticky lg:top-24 lg:block lg:space-y-1 lg:overflow-visible lg:border-b-0 lg:pb-0">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base
        const active = tab.enabled && pathname === href

        if (!tab.enabled) {
          return (
            <span
              key={tab.label}
              className="block cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground/45"
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
              "block rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-muted text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
