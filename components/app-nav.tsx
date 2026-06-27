"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  GitPullRequest,
  LayoutDashboard,
  Lightbulb,
  Plug,
  Puzzle,
  Settings,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
}

// Primary nav (spec §23.2). Later phases enable the disabled items.
const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  { href: "/projects", label: "Projects", icon: Boxes, enabled: true },
  { href: "/runs", label: "Runs", icon: Sparkles, enabled: true },
  { href: "/patterns", label: "Patterns", icon: Puzzle, enabled: true },
  { href: "/decisions", label: "Decisions", icon: Lightbulb, enabled: false },
  {
    href: "/pull-requests",
    label: "Pull requests",
    icon: GitPullRequest,
    enabled: false,
  },
  { href: "/integrations", label: "Integrations", icon: Plug, enabled: false },
  { href: "/settings", label: "Settings", icon: Settings, enabled: true },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {NAV.map((item) => {
        const active =
          item.enabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`))
        const Icon = item.icon

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground/45"
              title="Coming in a later phase"
            >
              <Icon className="size-3.5" />
              {item.label}
            </span>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
