const TRUE_VALUES = new Set(["1", "true", "yes", "on"])

export function timingsEnabled() {
  return (
    TRUE_VALUES.has(process.env.TURBO_HUB_DEBUG_TIMINGS?.toLowerCase() ?? "") ||
    TRUE_VALUES.has(process.env.DEBUG_TIMINGS?.toLowerCase() ?? "")
  )
}

function now() {
  return performance.now()
}

export async function timeAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!timingsEnabled()) return fn()

  const startedAt = now()
  try {
    return await fn()
  } finally {
    console.info(`[timing] ${label} ${(now() - startedAt).toFixed(1)}ms`)
  }
}

export function timeSync<T>(label: string, fn: () => T): T {
  if (!timingsEnabled()) return fn()

  const startedAt = now()
  try {
    return fn()
  } finally {
    console.info(`[timing] ${label} ${(now() - startedAt).toFixed(1)}ms`)
  }
}
