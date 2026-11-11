// The original retries a query only when the request itself failed (offline, DNS, TLS), at most twice.
// An HTTP error status is shown at once.
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = (error.message || "").toLowerCase();
  return (
    error.name === "TypeError" ||
    ["failed to fetch", "networkerror", "load failed", "ssl", "quic", "err_", "network request failed"].some((s) => m.includes(s))
  );
}

export const retryNetworkOnly = (failureCount: number, error: unknown): boolean => (failureCount >= 2 ? false : isNetworkError(error));
export const retryDelay = (attempt: number): number => Math.min(1000 * 2 ** attempt, 5000) + Math.random() * 250;
