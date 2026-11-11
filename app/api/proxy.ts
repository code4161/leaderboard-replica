import type { VercelRequest, VercelResponse } from "@vercel/node";

// The replica's own API layer. Read routes are served from the upstream public API
// (documented at /api-docs upstream: no key, CORS enabled) behind an allowlist of paths and of query parameters,
// with an edge cache. A request outside the allowlist is refused here and never reaches upstream,
// so the cache bounds upstream load. Write routes never leave this server.
const UPSTREAM = process.env.UPSTREAM_ORIGIN || "https://predicting.top";
const MAX_BYTES = 4_400_000;
const ID = "[A-Za-z0-9_.-]{1,64}";
const VALUE = /^[A-Za-z0-9_.-]{1,64}$/;
const TYPES = /^(application\/json|image\/(png|jpeg|gif|webp|avif))\b/;

export type Rule = { pattern: RegExp; ttl: number; params: string[] };
const rule = (pattern: string, ttl: number, params: string[] = []): Rule => ({ pattern: new RegExp(`^${pattern}$`), ttl, params });
const READ: Rule[] = [
  rule("leaderboard", 60, ["period"]),
  rule("embed/leaderboard", 60, ["period"]),
  rule("kalshi-leaderboard", 60, ["period", "limit", "nonSports"]),
  rule("daily-profit", 60),
  rule("p/overview", 120),
  rule("m/insights", 120, ["period", "limit"]),
  rule("battle/comparison", 60, ["poly_wallet", "kalshi_username"]),
  rule(`trader/${ID}`, 60),
  rule(`trader/${ID}/(positions|trades)`, 60, ["limit"]),
  rule(`trader/${ID}/history`, 60),
  rule(`kalshi/${ID}/(history|categories|category-change)`, 300),
  rule(`kalshi-avatar/${ID}`, 86400),
  rule(`wallet-avatar/${ID}`, 86400),
  rule(`x-avatar/${ID}/${ID}`, 86400),
  rule(`og/(trader|calendar|combo|pnl)/${ID}`, 600, ["month", "theme", "range"]),
];
const LOCAL_WRITE = /^(referral\/(visit|qualify)|submissions)$/;

export function matchRead(path: string): Rule | undefined {
  // A dot segment would be folded away when the upstream URL is built, landing on a path the pattern never saw.
  if (path.split("/").some((seg) => seg === "" || seg === "." || seg === "..")) return undefined;
  return READ.find((r) => r.pattern.test(path));
}

export function readQuery(rule: Rule, query: Record<string, string | string[] | undefined>): URLSearchParams | null {
  const qs = new URLSearchParams();
  for (const name of Object.keys(query).sort()) {
    if (name === "path") continue;
    const value = query[name];
    if (!rule.params.includes(name) || typeof value !== "string" || !VALUE.test(value)) return null;
    qs.append(name, value);
  }
  return qs;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.path;
  const path = (Array.isArray(raw) ? raw.join("/") : raw || "").replace(/^\/+|\/+$/g, "");
  res.setHeader("x-content-type-options", "nosniff");

  if (req.method === "POST" && LOCAL_WRITE.test(path)) {
    // Submissions and referral pings are accepted and dropped: a replica must not write to the original's records.
    res.status(200).json({ success: true, replica: true });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  const matched = matchRead(path);
  if (!matched) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  const qs = readQuery(matched, req.query);
  if (!qs) {
    res.status(400).json({ message: "Unknown or invalid query parameter" });
    return;
  }
  const url = `${UPSTREAM}/api/${path}${qs.size ? `?${qs}` : ""}`;
  try {
    // The Accept header is fixed: the cache key is the URL alone, so nothing a visitor sends may change the response.
    const up = await fetch(url, { headers: { accept: "*/*", "user-agent": "leaderboard-replica/0.1" }, signal: AbortSignal.timeout(25_000) });
    const type = up.headers.get("content-type") || "";
    const body = Buffer.from(await up.arrayBuffer());
    if (!TYPES.test(type) || body.length > MAX_BYTES) {
      res.status(502).json({ message: "Upstream response refused" });
      return;
    }
    res.status(up.status);
    res.setHeader("content-type", type);
    res.setHeader("cache-control", up.ok ? `public, s-maxage=${matched.ttl}, stale-while-revalidate=${matched.ttl * 5}` : "no-store");
    res.send(body);
  } catch {
    res.status(502).json({ message: "Upstream unavailable" });
  }
}
