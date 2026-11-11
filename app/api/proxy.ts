import type { VercelRequest, VercelResponse } from "@vercel/node";

// The replica's own API layer. Read routes are served from the upstream public API
// (documented at /api-docs upstream: no key, CORS enabled) behind an allowlist and an edge cache,
// so one visitor here is at most one upstream request per cache window. Write routes never leave this server.
const UPSTREAM = process.env.UPSTREAM_ORIGIN || "https://predicting.top";

type Rule = { pattern: RegExp; ttl: number };
const READ: Rule[] = [
  { pattern: /^leaderboard$/, ttl: 60 },
  { pattern: /^embed\/leaderboard$/, ttl: 60 },
  { pattern: /^kalshi-leaderboard$/, ttl: 60 },
  { pattern: /^daily-profit$/, ttl: 60 },
  { pattern: /^p\/overview$/, ttl: 120 },
  { pattern: /^m\/insights$/, ttl: 120 },
  { pattern: /^battle\/comparison$/, ttl: 60 },
  { pattern: /^trader\/[A-Za-z0-9_.-]{1,64}$/, ttl: 60 },
  { pattern: /^trader\/[A-Za-z0-9_.-]{1,64}\/(positions|trades|history|calendar|categories|pnl-history|daily-pnl)$/, ttl: 60 },
  { pattern: /^kalshi\/[A-Za-z0-9_.-]{1,64}\/(history|categories|category-change)$/, ttl: 300 },
  { pattern: /^kalshi-avatar\/[A-Za-z0-9_.-]{1,64}$/, ttl: 86400 },
  { pattern: /^wallet-avatar\/[A-Za-z0-9_.-]{1,64}$/, ttl: 86400 },
  { pattern: /^x-avatar\/[A-Za-z0-9_.\/-]{1,120}$/, ttl: 86400 },
  { pattern: /^og\/(trader|calendar|combo|pnl)\/[A-Za-z0-9_.-]{1,64}$/, ttl: 600 },
];
const LOCAL_WRITE = /^(referral\/(visit|qualify)|submissions)$/;

export function matchRead(path: string): Rule | undefined {
  if (path.includes("..")) return undefined;
  return READ.find((r) => r.pattern.test(path));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.path;
  const path = (Array.isArray(raw) ? raw.join("/") : raw || "").replace(/^\/+|\/+$/g, "");

  if (req.method === "POST" && LOCAL_WRITE.test(path)) {
    // Submissions and referral pings are accepted and dropped: a replica must not write to the original's records.
    res.status(200).json({ success: true, replica: true });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  const rule = matchRead(path);
  if (!rule) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "path") continue;
    for (const item of Array.isArray(v) ? v : [v]) if (typeof item === "string") qs.append(k, item);
  }
  const url = `${UPSTREAM}/api/${path}${qs.size ? `?${qs}` : ""}`;
  try {
    const up = await fetch(url, { headers: { accept: req.headers.accept || "*/*", "user-agent": "leaderboard-replica/0.1" }, signal: AbortSignal.timeout(25_000) });
    const type = up.headers.get("content-type") || "application/json";
    res.status(up.status);
    res.setHeader("content-type", type);
    res.setHeader("cache-control", up.ok ? `public, s-maxage=${rule.ttl}, stale-while-revalidate=${rule.ttl * 5}` : "no-store");
    res.send(Buffer.from(await up.arrayBuffer()));
  } catch {
    res.status(502).json({ message: "Upstream unavailable" });
  }
}
