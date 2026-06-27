import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { StatusChip } from "@/components/ui/status-chip"
import { cn } from "@/lib/utils"

export type RailStep = {
  key: string
  label: string
  href: string
  /** Short summary line, e.g. "5 tasks", "No PR yet", "1 run". */
  summary: string
  /** Optional status value rendered as a chip (auto-toned). */
  chip?: string | null
  /** Dim the step when there's nothing there yet. */
  muted?: boolean
}

/**
 * Compact horizontal progression Plan → Specs → Tasks → Runs → PRs. Each step
 * links to its page and shows a one-line state + count. Replaces the row of
 * equal-weight metric cards.
 */
export function WorkflowRail({ steps }: { steps: RailStep[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-stretch gap-3">
            <Link
              href={step.href}
              className={cn(
                "group flex flex-1 flex-col gap-1.5 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-muted/50",
                step.muted && "opacity-60"
              )}
            >
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {step.label}
              </span>
              <span className="text-sm font-medium">{step.summary}</span>
              {step.chip && <StatusChip value={step.chip} className="mt-0.5" />}
            </Link>
            {i < steps.length - 1 && (
              <ChevronRight className="hidden size-4 shrink-0 self-center text-muted-foreground/50 md:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
