"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export type ProjectNavCounts = {
  specs: number
  tasks: number
  runs: number
  prs: number
}

type NavItem = {
  label: string
  href: string
  count?: number
  // Matches when the pathname is exactly href or a descendant of it.
  matchPrefix?: boolean
  external?: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

function buildGroups(slug: string, counts: ProjectNavCounts): NavGroup[] {
  const base = `/projects/${slug}`
  return [
    {
      title: "Project",
      items: [
        { label: "Overview", href: base },
        { label: "Plan", href: `${base}/plan`, matchPrefix: true },
      ],
    },
    {
      title: "Planning",
      items: [
        {
          label: "Specs",
          href: `${base}/specs`,
          count: counts.specs,
          matchPrefix: true,
        },
        {
          label: "Tasks",
          href: `${base}/tasks`,
          count: counts.tasks,
          matchPrefix: true,
        },
      ],
    },
    {
      title: "Execution",
      items: [
        {
          label: "Runs",
          href: `${base}/runs`,
          count: counts.runs,
          matchPrefix: true,
        },
        {
          label: "PRs",
          href: `${base}/pull-requests`,
          count: counts.prs,
          matchPrefix: true,
        },
      ],
    },
    {
      title: "Memory",
      items: [
        { label: "Decisions", href: `${base}/decisions`, matchPrefix: true },
        { label: "Learnings", href: `${base}/learnings`, matchPrefix: true },
        { label: "Patterns", href: `/patterns`, external: true },
      ],
    },
    {
      title: "Setup",
      items: [
        { label: "Repository", href: `${base}#repository`, external: true },
        { label: "Settings", href: `/settings`, external: true },
      ],
    },
  ]
}

export function ProjectTabs({
  slug,
  counts,
}: {
  slug: string
  counts: ProjectNavCounts
}) {
  const pathname = usePathname()
  const groups = buildGroups(slug, counts)

  return (
    <nav className="flex gap-6 overflow-x-auto border-b border-border pb-3 lg:sticky lg:top-24 lg:block lg:space-y-5 lg:overflow-visible lg:border-b-0 lg:pb-0">
      {groups.map((group) => (
        <div key={group.title} className="shrink-0 space-y-1 lg:shrink">
          <p className="px-3 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground/70 uppercase">
            {group.title}
          </p>
          <div className="flex gap-1 lg:block lg:space-y-0.5">
            {group.items.map((item) => {
              const active =
                !item.external &&
                (item.matchPrefix
                  ? pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  : pathname === item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-muted text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span className="rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums text-muted-foreground">
                      {item.count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
