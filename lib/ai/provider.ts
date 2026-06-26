/**
 * Central model selection. String model ids route through the Vercel AI Gateway
 * (covered by OIDC on Vercel, or AI_GATEWAY_API_KEY locally).
 *
 * Plans and task breakdowns are mechanical enough for Haiku; spec generation is
 * the densest reasoning step, so it uses Sonnet. Both produce editable drafts.
 */
export const FAST_MODEL = "anthropic/claude-haiku-4-5";
export const REASONING_MODEL = "anthropic/claude-sonnet-4-6";
