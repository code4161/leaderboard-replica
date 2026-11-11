// The P&L history series: what is plotted, the axes, and the colours.

export type HistoryPoint = { timestamp: number; pnl: number; polymarket?: number; kalshi?: number };

export const POLYMARKET_COLOUR = "#3b82f6";
export const KALSHI_COLOUR = "#10b981";
export const COMBINED_COLOUR = "#f59e0b";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Past one week of data, keep the last point of each UTC day, and always the first point. */
export function thinHistory<T extends { timestamp: number }>(points: T[]): T[] {
  if (points.length < 2 || points[points.length - 1].timestamp - points[0].timestamp <= WEEK_MS) return points;
  const byDay = new Map<string, T>();
  for (const p of points) byDay.set(new Date(p.timestamp).toISOString().slice(0, 10), p);
  const days = Array.from(byDay.values());
  return days[0] === points[0] ? days : [points[0], ...days];
}

/** Five evenly spaced x ticks, or one when the range is empty. */
export function timeTicks(from: number, to: number): number[] {
  return to > from ? Array.from({ length: 5 }, (_, i) => Math.round(from + ((to - from) * i) / 4)) : [from];
}

export type ChartModel = {
  points: HistoryPoint[];
  split: boolean;
  domain: [number, number];
  ticks: number[];
  lineColour: string;
  longRange: boolean;
};

export function buildChart(history: HistoryPoint[]): ChartModel {
  const points = thinHistory(history);
  const split = points.some((p) => p.polymarket !== undefined);
  const values = points.flatMap((p) => (split ? [p.pnl, p.polymarket ?? 0, p.kalshi ?? 0] : [p.pnl]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(Math.abs(max - min) * 0.1, 100);
  const first = points[0];
  const last = points[points.length - 1];
  return {
    points,
    split,
    domain: [Math.min(min - pad, 0), max + pad],
    ticks: timeTicks(first.timestamp, last.timestamp),
    lineColour: split ? COMBINED_COLOUR : last.pnl >= first.pnl ? "#22c55e" : "#ef4444",
    longRange: last.timestamp - first.timestamp > 330 * 24 * 60 * 60 * 1000,
  };
}

export function tickLabel(ts: number, longRange: boolean): string {
  return new Date(ts).toLocaleDateString("en-US", longRange ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" });
}

export type Period = { pnl: number; buys: number; sells: number };
export type OverviewBar = { label: string; fullLabel: string; pnl: number; trades: number };

export function overviewBars(stats: Record<"1d" | "7d" | "30d" | "all", Period>): { bars: OverviewBar[]; domain: [number, number] } {
  const bar = (label: string, fullLabel: string, p: Period): OverviewBar => ({ label, fullLabel, pnl: p.pnl, trades: p.buys + p.sells });
  const bars = [bar("24h", "24 Hours", stats["1d"]), bar("7d", "7 Days", stats["7d"]), bar("30d", "30 Days", stats["30d"]), bar("All", "All Time", stats.all)];
  const reach = Math.max(...bars.map((b) => Math.abs(b.pnl)), 100);
  return { bars, domain: [-reach * 1.15, reach * 1.15] };
}
