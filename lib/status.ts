/**
 * Maps a machine status/health/priority/state value to a semantic tone, so the
 * UI can render consistent, subtly-colored status chips everywhere. Pair with
 * `labelize` (lib/labels.ts) for the display text and `StatusChip` for styling.
 */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral"

// Single master map across every enum value in lib/enums.ts. Where a value is
// shared across domains (e.g. "draft", "blocked") the tone is intentionally the
// same. Anything not listed falls back to "neutral".
const TONES: Record<string, Tone> = {
  // success — done / good / shipped
  good: "success",
  shipped: "success",
  done: "success",
  completed: "success",
  merged: "success",
  accepted: "success",
  active: "success",
  ready: "success",
  implemented: "success",
  success: "success",
  approved: "success",
  check_passed: "success",

  // info — in motion / under review
  building: "info",
  review: "info",
  in_review: "info",
  in_progress: "info",
  running: "info",
  open: "info",
  claimed: "info",
  queued: "info",
  waiting_for_input: "info",
  waiting_for_review: "info",
  reusable_idea: "info",
  convention: "info",
  sent: "info",

  // warning — needs attention soon
  at_risk: "warning",
  scoping: "warning",
  paused: "warning",
  needs_changes: "warning",
  proposed: "warning",
  medium: "warning",
  high: "warning",
  gotcha: "warning",

  // danger — blocked / failed / urgent
  blocked: "danger",
  failed: "danger",
  canceled: "danger",
  closed: "danger",
  rejected: "danger",
  urgent: "danger",
  failure: "danger",
  anti_pattern: "danger",
  error: "danger",

  // neutral — idle / informational (explicit for clarity; also the default)
  idea: "neutral",
  planned: "neutral",
  unknown: "neutral",
  draft: "neutral",
  superseded: "neutral",
  archived: "neutral",
  backlog: "neutral",
  created: "neutral",
  low: "neutral",
  other: "neutral",
}

export function statusTone(value: string): Tone {
  return TONES[value] ?? "neutral"
}
