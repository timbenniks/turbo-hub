/**
 * Turn a machine value (e.g. "at_risk", "task.created") into a display label
 * ("At risk", "Task created"). Single helper for all status/event rendering.
 */
export function labelize(value: string): string {
  return value.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}
