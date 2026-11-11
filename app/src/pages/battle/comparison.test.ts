import { describe, expect, it } from "vitest";
import { buildSeries, comparisonSchema, comparisonUrl, formatCompactUsd, tickInterval, valueDomain } from "./comparison";
import { retryNetworkOnly } from "../kalshi-leaderboard/retry";
import { kalshiProfileUrl, polymarketProfileUrl } from "./links";

const DAY = 24 * 60 * 60 * 1000;

describe("formatCompactUsd", () => {
  it("abbreviates thousands and millions with one decimal", () => {
    expect(formatCompactUsd(0)).toBe("+$0");
    expect(formatCompactUsd(999.4)).toBe("+$999");
    expect(formatCompactUsd(1000)).toBe("+$1.0K");
    expect(formatCompactUsd(93896.37)).toBe("+$93.9K");
    expect(formatCompactUsd(627553.85)).toBe("+$627.6K");
    expect(formatCompactUsd(1_250_000)).toBe("+$1.3M");
  });
  it("keeps the original's placement of the minus after the dollar mark", () => {
    expect(formatCompactUsd(-12)).toBe("$-12");
    expect(formatCompactUsd(-1500)).toBe("$-1.5K");
    expect(formatCompactUsd(-2_000_000)).toBe("$-2.0M");
  });
});

describe("buildSeries", () => {
  it("merges both histories on distinct timestamps in time order", () => {
    const s = buildSeries(
      [
        { timestamp: 2 * DAY, pnl: 20 },
        { timestamp: 0, pnl: 0 },
      ],
      [{ timestamp: 2 * DAY, pnl: 5 }],
    );
    expect(s).toEqual([
      { timestamp: 0, poly: 0, kalshi: 5 },
      { timestamp: 2 * DAY, poly: 20, kalshi: 5 },
    ]);
  });
  it("borrows the nearest sample only from within a week", () => {
    const s = buildSeries(
      [
        { timestamp: 0, pnl: 1 },
        { timestamp: 20 * DAY, pnl: 2 },
      ],
      [{ timestamp: 6 * DAY, pnl: 9 }],
    );
    expect(s).toEqual([
      { timestamp: 0, poly: 1, kalshi: 9 },
      { timestamp: 6 * DAY, poly: 1, kalshi: 9 },
      { timestamp: 20 * DAY, poly: 2, kalshi: undefined },
    ]);
  });
  it("treats exactly seven days as out of reach and takes the earlier sample on a tie", () => {
    expect(buildSeries([{ timestamp: 0, pnl: 1 }], [{ timestamp: 7 * DAY, pnl: 9 }])).toEqual([
      { timestamp: 0, poly: 1, kalshi: undefined },
      { timestamp: 7 * DAY, poly: undefined, kalshi: 9 },
    ]);
    const tie = buildSeries(
      [
        { timestamp: 0, pnl: 1 },
        { timestamp: 2 * DAY, pnl: 3 },
      ],
      [{ timestamp: DAY, pnl: 9 }],
    );
    expect(tie[1]).toEqual({ timestamp: DAY, poly: 1, kalshi: 9 });
  });
  it("leaves a side undefined when it has no history at all", () => {
    expect(buildSeries([], [{ timestamp: 5, pnl: 7 }])).toEqual([{ timestamp: 5, poly: undefined, kalshi: 7 }]);
    expect(buildSeries([], [])).toEqual([]);
  });
  it("uses the first sample when a timestamp repeats", () => {
    expect(
      buildSeries(
        [
          { timestamp: 1, pnl: 4 },
          { timestamp: 1, pnl: 8 },
        ],
        [],
      ),
    ).toEqual([{ timestamp: 1, poly: 4, kalshi: undefined }]);
  });
});

describe("valueDomain", () => {
  it("includes zero and pads by 15% of the range", () => {
    expect(valueDomain([{ timestamp: 0, poly: 100_000, kalshi: -20_000 }])).toEqual([-38_000, 118_000]);
    expect(valueDomain([{ timestamp: 0, poly: 50_000, kalshi: 20_000 }])).toEqual([-7_500, 57_500]);
  });
  it("pads by at least 1,000", () => {
    expect(valueDomain([{ timestamp: 0, poly: 10, kalshi: undefined }])).toEqual([-1000, 1010]);
    expect(valueDomain([])).toEqual([-1000, 1000]);
  });
});

describe("tickInterval", () => {
  it("is a sixth of the points and never below one", () => {
    expect(tickInterval(0)).toBe(1);
    expect(tickInterval(5)).toBe(1);
    expect(tickInterval(2349)).toBe(391);
  });
});

describe("comparison request and response", () => {
  it("builds the query the original sends", () => {
    expect(comparisonUrl("0xabc", "PredMTrader")).toBe("/api/battle/comparison?poly_wallet=0xabc&kalshi_username=PredMTrader");
  });
  it("rejects the API's error body", () => {
    expect(() => comparisonSchema.parse({ message: "poly_wallet and kalshi_username are required" })).toThrow();
  });
  it("accepts empty histories", () => {
    expect(comparisonSchema.parse({ polymarket: { history: [] }, kalshi: { history: [] } }).kalshi.history).toEqual([]);
  });
});

describe("profile links", () => {
  it("adds the partner parameter to each platform's profile address", () => {
    expect(polymarketProfileUrl("https://polymarket.com/profile/0x75e765216a57942d738d880ffcda854d9f869080")).toBe(
      "https://polymarket.com/profile/0x75e765216a57942d738d880ffcda854d9f869080?via=unbroken0x",
    );
    expect(kalshiProfileUrl("https://kalshi.com/ideas/profiles/PredMTrader")).toBe("https://kalshi.com/ideas/profiles/PredMTrader?referral=predictingtop");
  });
  it("normalises the Polymarket host and wallet path, and replaces an existing parameter", () => {
    expect(polymarketProfileUrl("https://www.polymarket.com/@0x75e765216a57942d738d880ffcda854d9f869080?via=someone")).toBe(
      "https://polymarket.com/profile/0x75e765216a57942d738d880ffcda854d9f869080?via=unbroken0x",
    );
    expect(polymarketProfileUrl("https://polymarket.com/@SomeName")).toBe("https://polymarket.com/@somename?via=unbroken0x");
  });
});

describe("comparison error retry", () => {
  it("retries the comparison's own HTTP error twice, as the original does, because its message reads as a failed fetch", () => {
    const error = new Error("Failed to fetch comparison data");
    expect(retryNetworkOnly(0, error)).toBe(true);
    expect(retryNetworkOnly(1, error)).toBe(true);
    expect(retryNetworkOnly(2, error)).toBe(false);
  });
});
