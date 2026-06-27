import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type NextAction = {
  label: string
  href: string
  primary?: boolean
}

export type NextActionContent = {
  title: string
  description: string
  actions: NextAction[]
}

/**
 * The single most prominent thing on a page: what to do next. One primary
 * action plus optional secondary actions. Used on the dashboard and project
 * overview, fed by `computeNextAction` (lib/next-action.ts).
 */
export function NextActionCard({
  title,
  description,
  actions,
  eyebrow = "Next action",
  className,
}: NextActionContent & { eyebrow?: string; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/15 bg-accent p-5 shadow-xs",
        className
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <ArrowRight className="size-3.5" />
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-accent-foreground">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        {description}
      </p>
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={buttonVariants({
                variant: action.primary ? "default" : "outline",
                size: "sm",
              })}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
