/**
 * Turn an enum value (e.g. "at_risk", "mcp_server") into a display label
 * ("At risk", "Mcp server"). Single helper for all enum rendering.
 */
export function labelize(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}
