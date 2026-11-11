import { describe, expect, it } from "vitest";
import { largeAvatar, smallAvatar } from "./avatar";
import { filterTraders, formatPnl, kalshiLeaderboardSchema, kalshiLeaderboardUrl, type KalshiTrader } from "./data";
import { isNetworkError, retryNetworkOnly } from "./retry";

const trader = (over: Partial<KalshiTrader>): KalshiTrader => ({
  rank: 1,
  kalshi_username: "user",
  name: "user",
  pfp: null,
  profile_path: null,
  kalshi_url: "https://kalshi.com/ideas/profiles/user",
  pnl: 0,
  ...over,
});

describe("formatPnl", () => {
  it("puts the sign before the dollar mark and rounds to whole dollars", () => {
    expect(formatPnl(7758129)).toBe("+$7,758,129");
    expect(formatPnl(3909807.2)).toBe("+$3,909,807");
    expect(formatPnl(779413.8)).toBe("+$779,414");
    expect(formatPnl(0)).toBe("+$0");
    expect(formatPnl(-1204.4)).toBe("-$1,204");
    expect(formatPnl(-2500000)).toBe("-$2,500,000");
    expect(formatPnl(999)).toBe("+$999");
  });
});

describe("filterTraders", () => {
  const rows = [
    trader({ name: "Coby", kalshi_username: "COBYBETS1onX" }),
    trader({ name: "Iabvek", kalshi_username: "lostzemblan" }),
    trader({ name: "dogname", kalshi_username: "dogname" }),
  ];
  it("keeps every row for a blank search", () => {
    expect(filterTraders(rows, "")).toBe(rows);
    expect(filterTraders(rows, "   ")).toBe(rows);
  });
  it("matches the display name or the username, ignoring case and outer spaces", () => {
    expect(filterTraders(rows, "coby").map((r) => r.name)).toEqual(["Coby"]);
    expect(filterTraders(rows, "  LOSTZEMBLAN ").map((r) => r.name)).toEqual(["Iabvek"]);
    expect(filterTraders(rows, "o").map((r) => r.name)).toEqual(["Coby", "Iabvek", "dogname"]);
  });
  it("returns nothing when no row matches", () => {
    expect(filterTraders(rows, "zzqq")).toEqual([]);
  });
});

describe("kalshiLeaderboardUrl", () => {
  it("asks for the period and adds the non-sports flag only when it is on", () => {
    expect(kalshiLeaderboardUrl("all", false)).toBe("/api/kalshi-leaderboard?period=all&limit=1000");
    expect(kalshiLeaderboardUrl("30d", true)).toBe("/api/kalshi-leaderboard?period=30d&limit=1000&nonSports=1");
  });
});

describe("kalshiLeaderboardSchema", () => {
  it("accepts a response row with null picture and profile path", () => {
    const parsed = kalshiLeaderboardSchema.parse({
      period: "all",
      tracked: 1000,
      lastUpdated: "2026-11-11T17:56:14.775Z",
      traders: [{ rank: 1, kalshi_username: "a", name: "a", pfp: null, profile_path: null, kalshi_url: "https://kalshi.com/ideas/profiles/a", pnl: 12.5 }],
    });
    expect(parsed.traders?.[0]?.pnl).toBe(12.5);
  });
  it("accepts a response with no traders yet", () => {
    expect(kalshiLeaderboardSchema.parse({}).traders).toBeUndefined();
  });
  it("rejects a row whose P&L is not a number", () => {
    expect(() => kalshiLeaderboardSchema.parse({ traders: [{ rank: 1, kalshi_username: "a", name: "a", kalshi_url: "u", pnl: "12" }] })).toThrow();
  });
});

describe("avatar", () => {
  it("routes X profile images through the avatar route at the asked size", () => {
    const x = "https://pbs.twimg.com/profile_images/1967112421371236352/HKf56KWs_400x400.jpg";
    expect(smallAvatar(x)).toBe("/api/x-avatar/1967112421371236352/HKf56KWs_bigger.jpg");
    expect(largeAvatar(x)).toBe("/api/x-avatar/1967112421371236352/HKf56KWs_400x400.jpg");
    expect(largeAvatar("https://pbs.twimg.com/profile_images/19/_Fie8EaH_normal.png")).toBe("/api/x-avatar/19/_Fie8EaH_400x400.png");
  });
  it("leaves any other picture address alone", () => {
    expect(smallAvatar("/api/kalshi-avatar/dogname")).toBe("/api/kalshi-avatar/dogname");
    expect(smallAvatar("https://abs.twimg.com/sticky/default_profile_images/default_profile.png")).toBe(
      "https://abs.twimg.com/sticky/default_profile_images/default_profile.png",
    );
  });
});

describe("retry", () => {
  it("retries a failed request twice and never an HTTP status", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("HTTP 500"))).toBe(false);
    expect(isNetworkError("boom")).toBe(false);
    expect(retryNetworkOnly(0, new TypeError("x"))).toBe(true);
    expect(retryNetworkOnly(1, new Error("net::ERR_CONNECTION_RESET"))).toBe(true);
    expect(retryNetworkOnly(2, new TypeError("x"))).toBe(false);
    expect(retryNetworkOnly(0, new Error("HTTP 502"))).toBe(false);
  });
});
