import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type WorkLineageItem = {
  label: string
  title: string
  href?: string
  status?: string
  missing?: boolean
}

export function WorkLineage({ items }: { items: WorkLineageItem[] }) {
  return (
    <nav
      aria-label="Work lineage"
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card/70 px-3 py-2 text-sm"
    >
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
          <LineageNode item={item} />
        </div>
      ))}
    </nav>
  )
}

function LineageNode({ item }: { item: WorkLineageItem }) {
  const content = (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1",
        item.missing
          ? "text-muted-foreground"
          : "text-foreground hover:bg-muted"
      )}
    >
      <span className="text-[0.68rem] font-medium text-muted-foreground uppercase">
        {item.label}
      </span>
      <span className="max-w-48 truncate">{item.title}</span>
      {item.status && (
        <Badge variant="outline" className="h-5 text-[0.68rem]">
          {item.status}
        </Badge>
      )}
    </span>
  )

  if (!item.href || item.missing) return content
  return <Link href={item.href}>{content}</Link>
}
