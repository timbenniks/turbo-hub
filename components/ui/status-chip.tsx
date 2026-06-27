import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { labelize } from "@/lib/labels"
import { statusTone, type Tone } from "@/lib/status"

const statusChipVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      tone: {
        success: "border-success/20 bg-success-bg text-success",
        warning: "border-warning/20 bg-warning-bg text-warning",
        danger: "border-danger/20 bg-danger-bg text-danger",
        info: "border-info/20 bg-info-bg text-info",
        neutral: "border-border bg-muted text-muted-foreground",
      } satisfies Record<Tone, string>,
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

export function StatusChip({
  value,
  tone,
  label,
  prefix,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof statusChipVariants> & {
    /** Machine status value; auto-toned and auto-labeled unless overridden. */
    value?: string
    /** Override the display text (defaults to labelize(value)). */
    label?: string
    /** Optional leading label, e.g. "Health". */
    prefix?: string
  }) {
  const resolvedTone: Tone = tone ?? (value ? statusTone(value) : "neutral")
  const text = label ?? (value ? labelize(value) : null)

  return (
    <span
      data-slot="status-chip"
      className={cn(statusChipVariants({ tone: resolvedTone }), className)}
      {...props}
    >
      {prefix && <span className="font-normal opacity-70">{prefix}</span>}
      {children ?? text}
    </span>
  )
}

export { statusChipVariants }
