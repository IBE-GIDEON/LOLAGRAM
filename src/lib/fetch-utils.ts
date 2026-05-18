/**
 * Wraps a fetch() call with:
 *  - AbortController-based timeout (default 12 s)
 *  - Optional retry with linear back-off
 *
 * Usage:
 *   const res = await fetchWithRetry("/api/orders", { method: "POST", ... })
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  { timeout = 12_000, retries = 1 }: { timeout?: number; retries?: number } = {}
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      })
      clearTimeout(timer)
      return response
    } catch (err) {
      clearTimeout(timer)
      lastError = err

      const isAbort = err instanceof DOMException && err.name === "AbortError"
      const isLast = attempt >= retries

      if (isLast) break

      // Back-off before retry: 600 ms, 1 200 ms, …
      await new Promise<void>((r) => setTimeout(r, 600 * (attempt + 1)))

      if (isAbort) continue // timed out — try again
      throw err // non-timeout network error — bail immediately
    }
  }

  const isAbort =
    lastError instanceof DOMException && (lastError as DOMException).name === "AbortError"

  throw isAbort
    ? new Error(`Request timed out after ${timeout}ms`)
    : lastError
}
