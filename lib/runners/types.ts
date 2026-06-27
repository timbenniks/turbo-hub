import type { AgentRunStatus } from "@/lib/enums"

/**
 * The seam every runner implements (spec §15.4). The manual runner is the only
 * one this phase; Cursor (Phase 4) and Claude local (Phase 7) register the same
 * interface so no vendor logic leaks into the core.
 */

export type CreateRunInput = {
  prompt?: string | null
  branchName?: string | null
  contextPackBody?: string | null
}

export type CreateRunResult = {
  /** External system's run id, if any. Null for the manual runner. */
  externalId?: string | null
  /** Initial status to record. Defaults to "created". */
  status?: AgentRunStatus
}

export type RunStatusResult = {
  status: AgentRunStatus
  summary?: string | null
  error?: string | null
}

export type Runner = {
  type: string
  createRun(input: CreateRunInput): Promise<CreateRunResult>
  getRunStatus(externalId: string): Promise<RunStatusResult>
  cancelRun(externalId: string): Promise<void>
}
