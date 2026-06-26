/**
 * Round-trip helpers for planning with an external agent: build a prompt that
 * tells the agent to emit labeled Markdown sections, then parse that output back
 * into the hub's structured plan fields.
 */

export type PlanContext = {
  name: string
  description?: string | null
  type?: string | null
  stack?: string[] | null
  goal?: string | null
  constraints?: string | null
}

export type ParsedPlan = {
  summary?: string
  goals?: string
  nonGoals?: string
  constraints?: string
  milestones?: string
  openQuestions?: string
  /** Set only when no known headings were found — keeps the paste intact. */
  body?: string
}

/** The section headings the agent must emit, in order. */
const SECTIONS = [
  "Summary",
  "Goals",
  "Non-goals",
  "Constraints",
  "Milestones",
  "Open questions",
] as const

/** Normalized heading text -> plan field. */
const HEADING_TO_FIELD: Record<string, keyof ParsedPlan> = {
  summary: "summary",
  goals: "goals",
  "non-goals": "nonGoals",
  "non goals": "nonGoals",
  nongoals: "nonGoals",
  constraints: "constraints",
  milestones: "milestones",
  "open questions": "openQuestions",
  openquestions: "openQuestions",
}

export function buildExternalPlanPrompt(project: PlanContext): string {
  const context = [
    `Project: ${project.name}`,
    project.type ? `Type: ${project.type}` : "",
    project.stack?.length ? `Stack: ${project.stack.join(", ")}` : "",
    project.description ? `Description: ${project.description}` : "",
    project.goal ? `Goal: ${project.goal}` : "",
    project.constraints ? `Constraints: ${project.constraints}` : "",
  ].filter(Boolean)

  return [
    "You are a pragmatic technical product planner. Write a concise, build-ready project plan.",
    "",
    ...context,
    "",
    "Return ONLY Markdown, using EXACTLY these second-level (`##`) headings, in this order:",
    "",
    ...SECTIONS.map((s) => `## ${s}`),
    "",
    'Write 1–2 short paragraphs under "Summary". Under every other heading use "- " bullet points, one per line.',
    'Include all headings; if a section is empty write "- None". Do not add other headings, preamble, or closing commentary.',
  ].join("\n")
}

function normalizeHeading(text: string): string {
  return text
    .replace(/[*_`#:]/g, "")
    .trim()
    .toLowerCase()
}

/**
 * Parse labeled-Markdown plan output into structured fields. Unknown sections
 * are ignored; if nothing recognizable is found, the whole input is returned as
 * `body` so the paste is never lost.
 */
export function parsePlanMarkdown(input: string): ParsedPlan {
  const lines = input.split(/\r?\n/)
  const buckets = new Map<keyof ParsedPlan, string[]>()
  let current: keyof ParsedPlan | null = null

  for (const line of lines) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/)
    if (heading) {
      current = HEADING_TO_FIELD[normalizeHeading(heading[1])] ?? null
      if (current && !buckets.has(current)) buckets.set(current, [])
      continue
    }
    if (current) buckets.get(current)!.push(line)
  }

  const result: ParsedPlan = {}
  for (const [field, content] of buckets) {
    const text = content.join("\n").trim()
    if (text) result[field] = text
  }

  if (Object.keys(result).length === 0) {
    const body = input.trim()
    if (body) result.body = body
  }
  return result
}
