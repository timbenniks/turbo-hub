import type { Runner } from "@/lib/runners/types"

/**
 * The manual runner: there is no external system. `createRun` just signals that
 * the hub should create its own run record; status and events are driven by the
 * user (UI) or by a local agent calling the API/MCP tools.
 */
export const manualRunner: Runner = {
  type: "manual",
  async createRun() {
    return { externalId: null, status: "created" }
  },
  async getRunStatus() {
    // No external system to poll — the hub record is the source of truth.
    throw new Error("Manual runs have no external status to poll.")
  },
  async cancelRun() {
    // Nothing external to cancel; the hub flips the run status itself.
  },
}
