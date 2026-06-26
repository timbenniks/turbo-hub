/**
 * Helpers to serialize structured AI output into the Markdown bodies stored on
 * plans/specs (README default: markdown-first, editable text).
 */

/** A list of strings → Markdown bullet list (empty string if none). */
export function bullets(items?: string[] | null): string {
  if (!items?.length) return ""
  return items.map((i) => `- ${i.trim()}`).join("\n")
}

/** Join non-empty Markdown sections with blank lines between them. */
export function sections(...parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join("\n\n")
}
