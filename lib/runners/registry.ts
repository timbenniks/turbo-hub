import { manualRunner } from "@/lib/runners/manual"
import type { Runner } from "@/lib/runners/types"

// Future runners (Cursor — Phase 4, Claude local — Phase 7) register here.
const RUNNERS: Record<string, Runner> = {
  manual: manualRunner,
}

export function getRunner(type: string): Runner {
  const runner = RUNNERS[type]
  if (!runner) throw new Error(`Unknown runner type "${type}".`)
  return runner
}
