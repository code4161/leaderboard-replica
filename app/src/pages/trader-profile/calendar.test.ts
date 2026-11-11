import { describe, expect, it } from "vitest";
import { dailyPnl, dayColour, dayTextColour, monthColour, monthView, recentMonths, yearByMonth } from "./calendar";

// The suite runs in the machine's zone; local-time dates are built with the local constructor so the cases hold anywhere.
const at = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m, d, h);

describe("dailyPnl", () => {
  it("needs two points", () => {
    expect(dailyPnl(undefined)).toEqual({ days: new Map(), start: null });
    expect(dailyPnl([{ timestamp: 1, pnl: 1 }]).start).toBeNull();
  });
  it("books each change to the UTC day it closes, a midnight point to the day before", () => {
    const { days, start } = dailyPnl([
      { timestamp: at(2026, 10, 2), pnl: 150 },
      { timestamp: at(2026, 10, 1), pnl: 100 },
      { timestamp: at(2026, 10, 3, 0), pnl: 120 },
      { timestamp: at(2026, 10, 3, 6), pnl: 200 },
    ]);
    expect(start?.getTime()).toBe(at(2026, 10, 1));
    expect(Object.fromEntries(days)).toEqual({ "2026-11-02": 20, "2026-11-03": 80 });
  });
  it("skips a gap longer than 36 hours", () => {
    const { days } = dailyPnl([
      { timestamp: at(2026, 10, 1), pnl: 0 },
      { timestamp: at(2026, 10, 4), pnl: 999 },
      { timestamp: at(2026, 10, 5), pnl: 1000 },
    ]);
    expect(Object.fromEntries(days)).toEqual({ "2026-11-05": 1 });
  });
});

describe("monthView", () => {
  const days = new Map([["2026-11-01", 7600], ["2026-11-02", -13100], ["2026-11-04", 799300], ["2026-11-07", 0], ["2026-11-20", 5], ["2026-10-31", -50]]);
  const now = new Date(2026, 10, 10, 9);
  const start = new Date(2026, 9, 30, 9);

  it("current month: totals stop at today, future days are flagged", () => {
    const m = monthView(days, start, now, 0);
    expect(m.label).toBe("Nov 2026");
    expect(m.isCurrent).toBe(true);
    expect(m.total).toBe(793800);
    expect([m.winDays, m.lossDays, m.tradingDays]).toEqual([2, 1, 4]);
    expect([m.bestDay, m.bestPnl]).toEqual([4, 799300]);
    // The strip has min(today, 14) slots that start 13 days before today, so on the 10th it ends at day 6.
    expect(m.stripDays).toEqual([1, 2, 3, 4, 5, 6]);
    expect(monthView(days, start, new Date(2026, 10, 20, 9), 0).stripDays).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(m.isFuture(11)).toBe(true);
    expect(m.isFuture(10)).toBe(false);
    expect(m.cells.slice(0, 2)).toEqual([1, 2]); // 1 Nov 2026 is a Sunday
    expect(m.cells).toHaveLength(30);
    expect(m.canGoBack).toBe(true);
  });
  it("earliest month: no way back, days before the start are marked, the strip skips them", () => {
    const m = monthView(days, start, now, -1);
    expect(m.label).toBe("Oct 2026");
    expect(m.canGoBack).toBe(false);
    expect(m.isBeforeStart(29)).toBe(true);
    expect(m.isBeforeStart(30)).toBe(false);
    expect(m.isStart(30)).toBe(true);
    expect(m.stripDays).toEqual([30, 31]);
    expect(monthView(days, null, now, -1).stripDays).toHaveLength(14);
    expect(m.total).toBe(-50);
    expect(m.bestDay).toBe(31);
    expect(m.cells.filter((c) => c === null)).toHaveLength(4); // 1 Oct 2026 is a Thursday
    expect(m.isFuture(31)).toBe(false);
  });
  it("without a start date every month can go back", () => {
    const m = monthView(new Map(), null, now, -3);
    expect(m.canGoBack).toBe(true);
    expect([m.bestDay, m.total, m.pnlOn(1)]).toEqual([-1, 0, null]);
  });
  it("crosses a year boundary", () => {
    expect(monthView(new Map(), null, new Date(2026, 0, 15), -1).label).toBe("Dec 2025");
  });
});

describe("yearByMonth", () => {
  it("sums the year, ignores other years, and names the best month", () => {
    const y = yearByMonth(new Map([["2026-11-01", 100], ["2026-11-02", 50], ["2026-03-09", -400], ["2025-12-31", 9999]]), 2026);
    expect(y.months[10]).toEqual({ total: 150, hasData: true });
    expect(y.months[2]).toEqual({ total: -400, hasData: true });
    expect(y.months[11].hasData).toBe(false);
    expect(y.ytd).toBe(-250);
    expect(y.bestMonth).toBe(10);
  });
  it("has no best month when nothing is positive", () => {
    expect(yearByMonth(new Map([["2026-03-09", -1]]), 2026).bestMonth).toBe(-1);
  });
});

describe("colours", () => {
  it("day cell bands", () => {
    expect(dayColour(null, false)).toBe("bg-muted/30");
    expect(dayColour(50, true)).toBe("bg-yellow-500/60");
    expect(dayColour(99, false)).toBe("bg-muted/40");
    expect(dayColour(10000, false)).toBe("bg-green-600/60");
    expect(dayColour(7600, false)).toBe("bg-green-500/50");
    expect(dayColour(2800, false)).toBe("bg-green-500/40");
    expect(dayColour(500, false)).toBe("bg-green-500/30");
    expect(dayColour(100, false)).toBe("bg-green-500/20");
    expect(dayColour(-13100, false)).toBe("bg-red-600/60");
    expect(dayColour(-8600, false)).toBe("bg-red-500/50");
    expect(dayColour(-4300, false)).toBe("bg-red-500/40");
    expect(dayColour(-500, false)).toBe("bg-red-500/30");
    expect(dayColour(-100, false)).toBe("bg-red-500/20");
  });
  it("day text and month cell", () => {
    expect(dayTextColour(null, false)).toBe("text-muted-foreground/50");
    expect(dayTextColour(-500, false)).toBe("text-red-600 dark:text-red-400");
    expect(dayTextColour(5, false)).toBe("text-muted-foreground");
    expect(monthColour({ total: 0, hasData: false }, false)).toBe("bg-muted/20");
    expect(monthColour({ total: 5, hasData: true }, true)).toBe("bg-green-500/40");
    expect(monthColour({ total: 10000, hasData: true }, false)).toBe("bg-green-500/25");
    expect(monthColour({ total: -1, hasData: true }, false)).toBe("bg-red-500/15");
    expect(monthColour({ total: 0, hasData: true }, false)).toBe("bg-muted/30");
  });
});

describe("recentMonths", () => {
  it("six UTC months, newest first, across a year boundary", () => {
    const m = recentMonths(new Date(Date.UTC(2026, 1, 3)));
    expect(m.map((x) => x.value)).toEqual(["2026-02", "2026-01", "2025-12", "2025-11", "2025-10", "2025-09"]);
    expect(m[0]).toEqual({ value: "2026-02", short: "Feb 2026", long: "February 2026", name: "February" });
  });
});
