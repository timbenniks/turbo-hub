/**
 * Client-side fetch helper for the JSON API. Throws on non-2xx with the API's
 * error message so callers can toast it. Keeps fetch boilerplate out of every
 * component.
 */
export async function apiSend<T = unknown>(
  url: string,
  method: "POST" | "PATCH" | "DELETE" | "GET" = "POST",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed")
  }
  return data as T
}
