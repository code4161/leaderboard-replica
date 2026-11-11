import { describe, expect, it } from "vitest";
import { buildChart, COMBINED_COLOUR, overviewBars, thinHistory, tickLabel, timeTicks } from "./series";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1, 6);

describe("thinHistory", () => {
  it("leaves a week or less untouched", () => {
    const pts = [0, 1, 2, 3].map((i) => ({ timestamp: T0 + i * 3_600_000, pnl: i }));
    expect(thinHistory(pts)).toBe(pts);
  });
  it("keeps the last point of each UTC day, and the first point", () => {
    const pts = [
      { timestamp: T0, pnl: 1 },
      { timestamp: T0 + 3_600_000, pnl: 2 },
      { timestamp: T0 + 9 * DAY, pnl: 3 },
      { timestamp: T0 + 9 * DAY + 60_000, pnl: 4 },
    ];
    expect(thinHistory(pts).map((p) => p.pnl)).toEqual([1, 2, 4]);
  });
});

describe("axes", () => {
  it("five ticks across the range, one when it is empty", () => {
    expect(timeTicks(0, 400)).toEqual([0, 100, 200, 300, 400]);
    expect(timeTicks(5, 5)).toEqual([5]);
  });
  it("labels by day, or by month and year past 330 days", () => {
    expect(tickLabel(Date.UTC(2026, 10, 4, 12), false)).toBe("Nov 4");
    expect(tickLabel(Date.UTC(2026, 10, 4, 12), true)).toBe("Nov 26");
  });
});

describe("buildChart", () => {
  it("single series: green when it ends up, red when down, floor at zero", () => {
    const up = buildChart([{ timestamp: T0, pnl: 1000 }, { timestamp: T0 + DAY, pnl: 3000 }]);
    expect(up.split).toBe(false);
    expect(up.lineColour).toBe("#22c55e");
    expect(up.domain).toEqual([0, 3200]);
    const down = buildChart([{ timestamp: T0, pnl: 50 }, { timestamp: T0 + DAY, pnl: -50 }]);
    expect(down.lineColour).toBe("#ef4444");
    expect(down.domain).toEqual([-150, 150]);
    expect(down.longRange).toBe(false);
  });
  it("per-platform series widen the domain and use the combined colour", () => {
    const c = buildChart([
      { timestamp: T0, pnl: 100, polymarket: 500, kalshi: -400 },
      { timestamp: T0 + 400 * DAY, pnl: 900, polymarket: 300 },
    ]);
    expect(c.split).toBe(true);
    expect(c.lineColour).toBe(COMBINED_COLOUR);
    expect(c.domain).toEqual([-530, 1030]);
    expect(c.longRange).toBe(true);
    expect(c.ticks).toHaveLength(5);
  });
});

describe("overviewBars", () => {
  it("counts trades and keeps the axis symmetric with a floor of 100", () => {
    const p = (pnl: number) => ({ pnl, buys: 2, sells: 3 });
    const { bars, domain } = overviewBars({ "1d": p(10), "7d": p(-2000), "30d": p(500), all: p(1000) });
    expect(bars.map((b) => b.label)).toEqual(["24h", "7d", "30d", "All"]);
    expect(bars[0].trades).toBe(5);
    expect(domain).toEqual([-2300, 2300]);
    expect(overviewBars({ "1d": p(0), "7d": p(0), "30d": p(0), all: p(1) }).domain[1]).toBeCloseTo(115);
  });
});
