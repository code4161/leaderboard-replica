import { describe, expect, it } from "vitest";
import { historyUrlFor, traderResponse, traderUrl } from "./data";
import { percent } from "./format";

const SCORE = { tier: "Great", score: 81, winRate: 0.631, sharpeRatio: 1.22, maxDrawdownPercent: 0.767, profitFactor: 4.49, rSquared: 0.9774 };
const parse = (smart_score: unknown) => traderResponse.parse({ trader: { name: "aenews", smart_score } }).trader?.smart_score;

describe("request paths", () => {
  it("leaves the ids the pages use byte for byte", () => {
    for (const id of ["0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1", "Mitchieboi", "no-such-trader-zz", "New.Jeans", "4thewin2.0", "King_Tradezz-KX"]) {
      expect(traderUrl(id)).toBe(`/api/trader/${id}`);
      expect(historyUrlFor({ kalshiUsername: id })).toBe(`/api/kalshi/${id}/history`);
    }
  });
  it("keeps an id from the address bar inside its path segment", () => {
    expect(traderUrl("../leaderboard?period=all#x")).toBe("/api/trader/..%2Fleaderboard%3Fperiod%3Dall%23x");
    expect(traderUrl("a b/c")).toBe("/api/trader/a%20b%2Fc");
    expect(historyUrlFor({ kalshiUsername: "a/../b?x" })).toBe("/api/kalshi/a%2F..%2Fb%3Fx/history");
    expect(historyUrlFor({ kalshiUsername: "k", historyUrl: "/api/trader/x/history" })).toBe("/api/trader/x/history");
    expect(historyUrlFor({})).toBeNull();
  });
});

describe("smart score card", () => {
  it("keeps a complete score as sent", () => {
    expect(parse(SCORE)).toEqual(SCORE);
  });
  it("keeps the card when a figure the original's arithmetic accepts is null", () => {
    for (const field of ["tier", "score", "winRate", "maxDrawdownPercent", "rSquared"] as const) {
      expect(parse({ ...SCORE, [field]: null })).toEqual({ ...SCORE, [field]: null });
    }
    expect(parse({ sharpeRatio: 1.22, profitFactor: 4.49 })).toEqual({ sharpeRatio: 1.22, profitFactor: 4.49 });
  });
  it("drops the card, and nothing else, when Sharpe or profit factor is not a number", () => {
    const parsed = traderResponse.parse({ trader: { name: "aenews", wallet: "0x1", smart_score: { ...SCORE, sharpeRatio: null } } }).trader;
    expect(parsed?.smart_score).toBeNull();
    expect(parsed?.name).toBe("aenews");
    expect(parse({ ...SCORE, profitFactor: null })).toBeNull();
    expect(parse(null)).toBeNull();
  });
  it("prints a null percentage as zero and an absent one as NaN, as the original's arithmetic does", () => {
    expect(percent(0.631, 0)).toBe("63");
    expect(percent(0.767, 1)).toBe("76.7");
    expect(percent(null, 0)).toBe("0");
    expect(percent(null, 1)).toBe("0.0");
    expect(percent(undefined, 0)).toBe("NaN");
  });
});
