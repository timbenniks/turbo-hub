import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type EmptyStateAction = {
  label: string
  href: string
}

/**
 * Explanatory empty state: tells the user not just that something is missing,
 * but why that object matters and how to create it. Replaces bare "No X yet."
 */
export function HelpfulEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: EmptyStateAction
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <p className="text-[0.9375rem] font-semibold">{title}</p>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      {action && (
        <Link
          href={action.href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
