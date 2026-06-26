/**
 * Turn arbitrary text into a URL-safe slug.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/**
 * Given a desired slug and the set of slugs already in use, return a unique
 * slug by appending a numeric suffix when needed.
 */
export function uniqueSlug(desired: string, taken: Set<string>): string {
  const base = slugify(desired) || "item"
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
