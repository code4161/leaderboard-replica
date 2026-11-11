const X_HOSTS = ["x.com", "twitter.com", "www.x.com", "www.twitter.com"];

/**
 * The X profile link for whatever a trader's `twitter` field holds (URL, bare host path or handle), or
 * null when it is not safely one. The one builder for every page: a full URL must be https on an X host.
 */
export function twitterUrl(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      const u = new URL(v);
      const unsafe = u.pathname.includes("javascript:") || u.pathname.includes("data:");
      return u.protocol === "https:" && X_HOSTS.includes(u.hostname) && !unsafe ? v : null;
    } catch {
      return null;
    }
  }
  if (/^(x\.com|twitter\.com)\/[\w_]+$/.test(v)) return `https://${v}`;
  const handle = v.replace(/^@/, "");
  return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? `https://x.com/${handle}` : null;
}
