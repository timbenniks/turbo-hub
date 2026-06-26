import { Label } from "@/components/ui/label"

/** Label + control wrapper for forms. */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

/** Read-only label + Markdown-ish body block (renders stored text as-is). */
export function ReadField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  )
}
