import { describe, expect, it } from "vitest";
import { matchRead } from "./proxy";

describe("read allowlist", () => {
  it("admits the documented read routes", () => {
    for (const p of ["leaderboard", "kalshi-leaderboard", "daily-profit", "p/overview", "m/insights", "trader/0xabc", "trader/0xabc/positions", "trader/Some_User/trades", "kalshi/aenews/history", "kalshi/aenews/categories", "x-avatar/123/abc_bigger.jpg", "og/trader/aenews", "battle/comparison"]) {
      expect(matchRead(p), p).toBeDefined();
    }
  });
  it("refuses anything else", () => {
    for (const p of ["", "admin", "submissions", "referral/visit", "trader", "trader/a/b/c", "trader/../secret", "kalshi/x/unknown", "leaderboard/extra", "og/other/x"]) {
      expect(matchRead(p), p).toBeUndefined();
    }
  });
  it("caches avatars for a day and rankings for a minute", () => {
    expect(matchRead("x-avatar/1/a_bigger.jpg")?.ttl).toBe(86400);
    expect(matchRead("leaderboard")?.ttl).toBe(60);
  });
});
