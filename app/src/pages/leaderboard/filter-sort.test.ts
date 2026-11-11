import { describe, expect, it } from "vitest";
import {
  accountHref, matchesFilters, nextDirection, sanitizeSearch, scoreColor, selectTraders, sharpeFor, sharpeWindow, sortIndicator, sortValue, twitterUrl,
  type Filters,
} from "./filter-sort";
import { polymarketProfileUrl, withVia } from "./referral";
import { apiPeriod, leaderboardResponse, type Trader } from "./types";

const W = (n: number) => "0x" + String(n).padStart(40, "0");
function trader(over: Partial<Trader> & { name: string }): Trader {
  return { rank: 1, wallet: W(1), platform: "polymarket", twitter: "", stats: { pnl: 100 }, ...over };
}
const base: Filters = { platform: "all", affiliatedOnly: false, linkedOnly: false, hideSports: false, hideEsports: false, search: "", period: "1d", bigMoversOnly: false };
const names = (list: Trader[]) => list.map((t) => t.name);

describe("matchesFilters", () => {
  it("filters by platform, counting a trader on both under Polymarket and Kalshi only", () => {
    const both = trader({ name: "b", platform: "both" });
    const hl = trader({ name: "h", platform: "hyperliquid" });
    const none = trader({ name: "n", platform: null });
    expect(matchesFilters(both, { ...base, platform: "polymarket" })).toBe(true);
    expect(matchesFilters(both, { ...base, platform: "kalshi" })).toBe(true);
    expect(matchesFilters(both, { ...base, platform: "hyperliquid" })).toBe(false);
    expect(matchesFilters(hl, { ...base, platform: "hyperliquid" })).toBe(true);
    expect(matchesFilters(hl, { ...base, platform: "polymarket" })).toBe(false);
    expect(matchesFilters(none, { ...base, platform: "polymarket" })).toBe(true);
    expect(matchesFilters(none, { ...base, platform: "kalshi" })).toBe(false);
  });
  it("hides sports traders at half their profit or more", () => {
    expect(matchesFilters(trader({ name: "s", sports_share: 0.5 }), { ...base, hideSports: true })).toBe(false);
    expect(matchesFilters(trader({ name: "s", sports_share: 0.49 }), { ...base, hideSports: true })).toBe(true);
    expect(matchesFilters(trader({ name: "s" }), { ...base, hideSports: true })).toBe(true);
  });
  it("hides esports traders only when they have no X account", () => {
    const f = { ...base, hideEsports: true };
    expect(matchesFilters(trader({ name: "e", esports_share: 0.9, twitter: " " }), f)).toBe(false);
    expect(matchesFilters(trader({ name: "e", esports_share: 0.9, twitter: "https://x.com/e" }), f)).toBe(true);
    expect(matchesFilters(trader({ name: "e", esports_share: 0.2 }), f)).toBe(true);
  });
  it("keeps only linked or affiliated traders when asked", () => {
    expect(matchesFilters(trader({ name: "t", twitter: "  " }), { ...base, linkedOnly: true })).toBe(false);
    expect(matchesFilters(trader({ name: "t", twitter: "x" }), { ...base, linkedOnly: true })).toBe(true);
    expect(matchesFilters(trader({ name: "t" }), { ...base, affiliatedOnly: true })).toBe(false);
    expect(matchesFilters(trader({ name: "t", affiliated: true }), { ...base, affiliatedOnly: true })).toBe(true);
  });
  it("searches name, wallet and Kalshi username without regard to case", () => {
    const t = trader({ name: "AeNews", wallet: "0xABCDEF", kalshi_username: "Kal_User" });
    for (const q of ["aen", "0xabc", "kal_u"]) expect(matchesFilters(t, { ...base, search: q })).toBe(true);
    expect(matchesFilters(t, { ...base, search: "zzz" })).toBe(false);
    expect(matchesFilters(trader({ name: "x", wallet: null }), { ...base, search: "0x" })).toBe(false);
  });
  it("applies the $5 floor to the daily view only, on the size of the move", () => {
    const small = trader({ name: "s", stats: { pnl: -4.99 } });
    const loss = trader({ name: "l", stats: { pnl: -5 } });
    expect(matchesFilters(small, { ...base, bigMoversOnly: true })).toBe(false);
    expect(matchesFilters(loss, { ...base, bigMoversOnly: true })).toBe(true);
    expect(matchesFilters(small, { ...base, bigMoversOnly: true, period: "all" })).toBe(true);
  });
});

describe("selectTraders", () => {
  const score = (s: number, extra: object = {}) => ({ score: s, winRate: 0.5, ...extra });
  const list = [
    trader({ name: "a", stats: { pnl: 30 }, smart_score: score(50, { sharpe1d: 1, sharpeRatio: 3 }), roi: 0.2, join_date: "2024-11-01" }),
    trader({ name: "b", stats: { pnl: -10 }, smart_score: null, join_date: "Oct 2025" }),
    trader({ name: "c", stats: { pnl: 30 }, smart_score: score(80, { sharpe1d: 2, sharpeRatio: 1 }), roi: -0.1, join_date: null }),
  ];
  it("keeps API order without a sort column and does not touch its input", () => {
    expect(names(selectTraders(list, base, null, "asc"))).toEqual(["a", "b", "c"]);
    selectTraders(list, base, "pnl", "asc");
    expect(names(list)).toEqual(["a", "b", "c"]);
  });
  it("sorts both ways and keeps ties in API order", () => {
    expect(names(selectTraders(list, base, "pnl", "asc"))).toEqual(["b", "a", "c"]);
    expect(names(selectTraders(list, base, "pnl", "desc"))).toEqual(["a", "c", "b"]);
  });
  it("treats a missing score as zero, a missing ROI as lowest and a missing join date as oldest", () => {
    expect(names(selectTraders(list, base, "score", "desc"))).toEqual(["c", "a", "b"]);
    expect(names(selectTraders(list, base, "roi", "asc"))).toEqual(["b", "c", "a"]);
    expect(names(selectTraders(list, base, "joined", "asc"))).toEqual(["c", "a", "b"]);
  });
  it("sorts Sharpe by the figure of the selected period", () => {
    expect(names(selectTraders(list, base, "sharpe", "desc"))).toEqual(["c", "a", "b"]);
    expect(names(selectTraders(list, { ...base, period: "all" }, "sharpe", "desc"))).toEqual(["a", "c", "b"]);
    expect(sharpeFor(list[0], "1m")).toBeUndefined();
    expect(sortValue(list[0], "sharpe", "1m")).toBe(0);
  });
  it("filters before sorting", () => {
    expect(names(selectTraders(list, { ...base, bigMoversOnly: true, search: "c" }, "pnl", "asc"))).toEqual(["c"]);
    expect(selectTraders(list, { ...base, search: "nobody" }, "pnl", "asc")).toEqual([]);
  });
});

describe("sort controls", () => {
  it("starts ascending and flips on the same header", () => {
    expect(nextDirection(null, "asc", "pnl")).toBe("asc");
    expect(nextDirection("pnl", "asc", "pnl")).toBe("desc");
    expect(nextDirection("pnl", "desc", "pnl")).toBe("asc");
    expect(nextDirection("pnl", "desc", "score")).toBe("asc");
  });
  it("marks only the sorted header", () => {
    expect(sortIndicator("pnl", "asc", "pnl")).toBe(" ↓");
    expect(sortIndicator("pnl", "desc", "pnl")).toBe(" ↑");
    expect(sortIndicator("pnl", "desc", "score")).toBe("");
  });
  it("names the Sharpe window", () => {
    expect(sharpeWindow("1d")).toEqual({ header: "3D", title: "3D" });
    expect(sharpeWindow("1m")).toEqual({ header: "30D", title: "30D" });
    expect(sharpeWindow("all")).toEqual({ header: "", title: "All time" });
  });
  it("colours the score by band", () => {
    expect(scoreColor(80)).toContain("green-700");
    expect(scoreColor(79.9)).toContain("green-600");
    expect(scoreColor(50)).toContain("lime-600");
    expect(scoreColor(35)).toContain("orange-500");
    expect(scoreColor(34.9)).toContain("red-600");
  });
});

describe("sanitizeSearch", () => {
  it("keeps letters, digits, spaces, underscore and hyphen, up to 50 characters", () => {
    expect(sanitizeSearch("a.e!@n#")).toBe("aen");
    expect(sanitizeSearch("King_Tradezz-KX 1")).toBe("King_Tradezz-KX 1");
    expect(sanitizeSearch("<script>")).toBe("script");
    expect(sanitizeSearch("x".repeat(60))).toHaveLength(50);
  });
});

describe("twitterUrl", () => {
  it("accepts https links to X and Twitter, bare host paths and handles", () => {
    expect(twitterUrl("https://x.com/aenews")).toBe("https://x.com/aenews");
    expect(twitterUrl(" https://twitter.com/a ")).toBe("https://twitter.com/a");
    expect(twitterUrl("x.com/aenews")).toBe("https://x.com/aenews");
    expect(twitterUrl("@aenews")).toBe("https://x.com/aenews");
    expect(twitterUrl("aenews")).toBe("https://x.com/aenews");
  });
  it("refuses everything else", () => {
    for (const bad of ["", "   ", null, "http://x.com/a", "https://evil.com/x.com/a", "https://x.com.evil.com/a", "javascript:alert(1)", "a/b", "name_longer_than_15_chars", "https://x.com/javascript:alert(1)"]) {
      expect(twitterUrl(bad)).toBeNull();
    }
  });
});

describe("links", () => {
  it("prefers the Kalshi profile for a Kalshi trader, else the wallet", () => {
    expect(accountHref(trader({ name: "k", platform: "kalshi", kalshi_username: "kal", wallet: W(2) }))).toBe("/account/kal");
    expect(accountHref(trader({ name: "b", platform: "both", kalshi_username: "kal", wallet: W(2) }))).toBe(`/account/${W(2)}`);
    expect(accountHref(trader({ name: "k", wallet: null, kalshi_username: "kal" }))).toBe("/account/kal");
    expect(accountHref(trader({ name: "n", wallet: null }))).toBeNull();
  });
  it("encodes the id as one path segment and leaves ordinary ids as they are", () => {
    expect(accountHref(trader({ name: "k", platform: "kalshi", kalshi_username: "New.Jeans-4_x" }))).toBe("/account/New.Jeans-4_x");
    expect(accountHref(trader({ name: "k", platform: "kalshi", kalshi_username: "a/../b?x=1#y" }))).toBe("/account/a%2F..%2Fb%3Fx%3D1%23y");
    expect(accountHref(trader({ name: "w", wallet: "0x1/../../api" }))).toBe("/account/0x1%2F..%2F..%2Fapi");
  });
  it("adds the referral parameter to outbound Polymarket links", () => {
    expect(polymarketProfileUrl(W(3), null)).toBe(`https://polymarket.com/profile/${W(3)}?via=unbroken0x`);
    expect(polymarketProfileUrl(null, "https://www.polymarket.com/@SomeOne?tab=x")).toBe("https://polymarket.com/@someone?tab=x&via=unbroken0x");
    expect(polymarketProfileUrl("not-a-wallet", null)).toBeNull();
    expect(withVia("https://polymarket.com")).toBe("https://polymarket.com/?via=unbroken0x");
    expect(withVia(`https://polymarket.com/@${W(4)}`)).toBe(`https://polymarket.com/profile/${W(4)}?via=unbroken0x`);
    expect(withVia("/path?a=1#frag", "code")).toBe("/path?a=1&via=code#frag");
    expect(withVia("/path", "code")).toBe("/path?via=code");
  });
});

describe("API boundary", () => {
  it("maps period buttons to the API's period values", () => {
    expect((["1d", "1w", "1m", "1q", "ytd", "all"] as const).map(apiPeriod)).toEqual(["1d", "7d", "30d", "90d", "ytd", "all"]);
  });
  it("accepts a trader with nulls and missing optional fields", () => {
    const parsed = leaderboardResponse.parse({
      traders: [{ rank: 1, name: "a", wallet: null, twitter: "", pfp: "", platform: "kalshi", stats: { pnl: 1, buys: 0 }, smart_score: null, extra: 1 }],
      lastUpdated: "2026-11-11T18:31:59.798Z",
    });
    expect(parsed.traders[0].roi).toBeUndefined();
    expect(parsed.traders[0].stats.pnl).toBe(1);
  });
  it("drops only the row that has no P&L, never the list", () => {
    const parsed = leaderboardResponse.parse({
      traders: [{ rank: 1, name: "a", stats: { pnl: 5 } }, { rank: 2, name: "b", stats: {} }, null, "junk", { rank: 3, name: "c" }, { rank: 4, name: "d", stats: { pnl: -2 } }],
    });
    expect(parsed.traders.map((t) => t.name)).toEqual(["a", "d"]);
  });
  it("reads a field of the wrong type as absent and keeps the row", () => {
    const [t] = leaderboardResponse.parse({
      traders: [{
        rank: "7", name: null, wallet: 5, twitter: { handle: "x" }, pfp: false, platform: 1, kalshi_username: ["k"],
        stats: { pnl: 12.5 }, join_date: 20260101, smart_score: "high", affiliated: "yes", sports_share: "0.9", day_mover: { label: 1 }, roi: "12%",
      }],
    }).traders;
    expect(t).toEqual({
      rank: "7", name: "", wallet: null, twitter: null, pfp: null, platform: null, kalshi_username: null,
      stats: { pnl: 12.5 }, join_date: null, smart_score: null, affiliated: null, sports_share: null, day_mover: null, roi: undefined,
    });
  });
  it("keeps a smart score whose figures are null, as the original renders one", () => {
    const [t] = leaderboardResponse.parse({ traders: [{ rank: 1, name: "a", stats: { pnl: 1 }, smart_score: { score: null, winRate: null, sharpeRatio: "n/a" } }] }).traders;
    expect(t.smart_score).toEqual({ score: null, winRate: null, sharpeRatio: null });
    expect(sortValue(t, "score", "1d")).toBe(0);
  });
  it("gives an empty list, not an error, for a body with no trader list", () => {
    expect(leaderboardResponse.parse({ error: "nope" })).toEqual({ traders: [], lastUpdated: null });
    expect(leaderboardResponse.parse({ traders: "soon", lastUpdated: 5 })).toEqual({ traders: [], lastUpdated: null });
    expect(leaderboardResponse.parse(null)).toEqual({ traders: [], lastUpdated: null });
  });
  it("parses every row of the list the page was built against", () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ rank: i + 1, name: `t${i}`, wallet: W(i), stats: { pnl: i }, roi: i === 0 ? null : undefined, kalshi_profile: "https://kalshi.com/ideas/profiles/x", kalshi_username: null }));
    const parsed = leaderboardResponse.parse({ traders: rows, lastUpdated: "2026-11-11T18:31:59.798Z" });
    expect(parsed.traders).toHaveLength(3);
    expect(parsed.traders[0].roi).toBeNull();
    expect(parsed.traders[1].roi).toBeUndefined();
    expect(parsed.lastUpdated).toBe("2026-11-11T18:31:59.798Z");
  });
});
