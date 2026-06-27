import { cn } from "@/lib/utils"

/**
 * Constrains prose-heavy content to a comfortable reading width so plan/spec
 * documents don't stretch across the full monitor.
 */
export function ReadableContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="readable-content"
      className={cn("max-w-[820px] space-y-6 text-[0.9375rem]", className)}
      {...props}
    />
  )
}
