"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PROJECT_STATUSES } from "@/lib/enums"
import { labelize } from "@/lib/labels"

type TagOption = { id: string; name: string }

export function ProjectsFilter({ tags }: { tags: TagOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`)
  }

  // Debounce the text search.
  const [q, setQ] = React.useState(params.get("q") ?? "")
  React.useEffect(() => {
    const id = setTimeout(() => setParam("q", q), 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search projects…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-8 max-w-xs"
      />
      <NativeSelect
        value={params.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">All statuses</option>
        {PROJECT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {labelize(s)}
          </option>
        ))}
      </NativeSelect>
      {tags.length > 0 && (
        <NativeSelect
          value={params.get("tagId") ?? ""}
          onChange={(e) => setParam("tagId", e.target.value)}
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      )}
    </div>
  )
}
