import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightly styled native <select>. Used where a full popover Select is overkill
 * (compact filters, form enums). Forwards ref so it works with react-hook-form.
 */
export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(function NativeSelect({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      data-slot="native-select"
      className={cn(
        "h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
})
