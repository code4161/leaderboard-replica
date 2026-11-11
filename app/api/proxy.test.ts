import { afterEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler, { matchRead, readQuery } from "./proxy";

describe("read allowlist", () => {
  it("admits the documented read routes", () => {
    for (const p of ["leaderboard", "kalshi-leaderboard", "daily-profit", "p/overview", "m/insights", "trader/0xabc", "trader/0xabc/positions", "trader/Some_User/trades", "trader/0xabc/history", "kalshi/aenews/history", "kalshi/aenews/categories", "kalshi/aenews/category-change", "x-avatar/123/abc_bigger.jpg", "wallet-avatar/0xabc", "og/trader/aenews", "battle/comparison"]) {
      expect(matchRead(p), p).toBeDefined();
    }
  });
  it("refuses anything else", () => {
    for (const p of ["", "admin", "submissions", "referral/visit", "trader", "trader/a/b/c", "trader/../secret", "kalshi/x/unknown", "leaderboard/extra", "og/other/x"]) {
      expect(matchRead(p), p).toBeUndefined();
    }
  });
  it("refuses dot segments, which URL building would fold away", () => {
    for (const p of ["kalshi/./history", "trader/.", "x-avatar/./a", "trader/./positions", "trader//positions"]) {
      expect(matchRead(p), p).toBeUndefined();
    }
  });
  it("caches avatars for a day and rankings for a minute", () => {
    expect(matchRead("x-avatar/1/a_bigger.jpg")?.ttl).toBe(86400);
    expect(matchRead("leaderboard")?.ttl).toBe(60);
  });
});

describe("query allowlist", () => {
  const lb = matchRead("leaderboard")!;
  it("keeps a route's own parameters in a stable order", () => {
    const k = matchRead("kalshi-leaderboard")!;
    expect(readQuery(k, { path: "kalshi-leaderboard", period: "30d", limit: "100" })?.toString()).toBe("limit=100&period=30d");
  });
  it("refuses an unknown parameter, a repeated one and an odd value", () => {
    expect(readQuery(lb, { period: "1d", x: "1" })).toBeNull();
    expect(readQuery(lb, { period: ["1d", "all"] })).toBeNull();
    expect(readQuery(lb, { period: "1d&x=1" })).toBeNull();
    expect(readQuery(matchRead("daily-profit")!, { cachebust: "9" })).toBeNull();
  });
});

type Sent = { status: number; headers: Record<string, string>; body: unknown };
function call(method: string, query: Record<string, string | string[]>, headers: Record<string, string> = {}) {
  const sent: Sent = { status: 0, headers: {}, body: undefined };
  const res = {
    status(code: number) { sent.status = code; return res; },
    setHeader(k: string, v: string) { sent.headers[k.toLowerCase()] = v; return res; },
    json(b: unknown) { sent.body = b; return res; },
    send(b: unknown) { sent.body = b; return res; },
  };
  return handler({ method, query, headers } as unknown as VercelRequest, res as unknown as VercelResponse).then(() => sent);
}
const upstream = (status: number, type: string, body = "{}") =>
  vi.fn(async () => new Response(body, { status, headers: { "content-type": type } }));

describe("handler", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("answers writes locally and never calls upstream", async () => {
    const f = upstream(200, "application/json"); vi.stubGlobal("fetch", f);
    const r = await call("POST", { path: "submissions" });
    expect(r.status).toBe(200); expect(r.body).toEqual({ success: true, replica: true }); expect(f).not.toHaveBeenCalled();
  });
  it("refuses other methods, unknown paths and unknown parameters without calling upstream", async () => {
    const f = upstream(200, "application/json"); vi.stubGlobal("fetch", f);
    expect((await call("DELETE", { path: "leaderboard" })).status).toBe(405);
    expect((await call("POST", { path: "leaderboard" })).status).toBe(405);
    expect((await call("GET", { path: "admin/users" })).status).toBe(404);
    expect((await call("GET", { path: "leaderboard", x: "1" })).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("fetches the allowlisted URL with a fixed Accept header and sets the edge cache", async () => {
    const f = upstream(200, "application/json; charset=utf-8", '{"ok":1}'); vi.stubGlobal("fetch", f);
    const r = await call("GET", { path: "leaderboard", period: "1d" }, { accept: "text/html" });
    const [url, init] = f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(url).toBe("https://predicting.top/api/leaderboard?period=1d");
    expect(init.headers.accept).toBe("*/*");
    expect(r.status).toBe(200);
    expect(r.headers["cache-control"]).toBe("public, s-maxage=60, stale-while-revalidate=300");
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
  });
  it("passes an upstream error through uncached", async () => {
    vi.stubGlobal("fetch", upstream(400, "application/json", '{"message":"Invalid period"}'));
    const r = await call("GET", { path: "leaderboard", period: "bogus" });
    expect(r.status).toBe(400); expect(r.headers["cache-control"]).toBe("no-store");
  });
  it("refuses an upstream body that is not JSON or an image", async () => {
    vi.stubGlobal("fetch", upstream(200, "text/html", "<script>1</script>"));
    expect((await call("GET", { path: "kalshi-avatar/someone" })).status).toBe(502);
  });
  it("reports an unreachable upstream as 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect((await call("GET", { path: "daily-profit" })).status).toBe(502);
  });
});
