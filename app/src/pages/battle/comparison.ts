import { z } from "zod";

const pointSchema = z.object({ timestamp: z.number(), pnl: z.number() });
export type HistoryPoint = z.infer<typeof pointSchema>;

export const comparisonSchema = z.object({
  polymarket: z.object({ history: z.array(pointSchema) }),
  kalshi: z.object({ history: z.array(pointSchema) }),
});
export type Comparison = z.infer<typeof comparisonSchema>;

export function comparisonUrl(polyWallet: string, kalshiUsername: string): string {
  return `/api/battle/comparison?poly_wallet=${polyWallet}&kalshi_username=${kalshiUsername}`;
}

export async function fetchComparison(polyWallet: string, kalshiUsername: string): Promise<Comparison> {
  const res = await fetch(comparisonUrl(polyWallet, kalshiUsername));
  if (!res.ok) throw new Error("Failed to fetch comparison data");
  return comparisonSchema.parse(await res.json());
}

export type SeriesPoint = { timestamp: number; poly: number | undefined; kalshi: number | undefined };

// A side with no sample at a timestamp borrows its nearest sample, but only from within a week.
const NEAREST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function valueAt(history: readonly HistoryPoint[], exact: ReadonlyMap<number, number>, timestamp: number): number | undefined {
  const hit = exact.get(timestamp);
  if (hit !== undefined || history.length === 0) return hit;
  const nearest = history.reduce((best, p) => (Math.abs(p.timestamp - timestamp) < Math.abs(best.timestamp - timestamp) ? p : best));
  return Math.abs(nearest.timestamp - timestamp) < NEAREST_WINDOW_MS ? nearest.pnl : undefined;
}

// The first sample wins when a history repeats a timestamp.
function firstByTimestamp(history: readonly HistoryPoint[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const p of history) if (!m.has(p.timestamp)) m.set(p.timestamp, p.pnl);
  return m;
}

// One row per distinct timestamp of either history, in time order, each carrying both sides' P&L.
export function buildSeries(poly: readonly HistoryPoint[], kalshi: readonly HistoryPoint[]): SeriesPoint[] {
  const polyExact = firstByTimestamp(poly);
  const kalshiExact = firstByTimestamp(kalshi);
  const stamps = Array.from(new Set([...poly, ...kalshi].map((p) => p.timestamp))).sort((a, b) => a - b);
  return stamps.map((timestamp) => ({
    timestamp,
    poly: valueAt(poly, polyExact, timestamp),
    kalshi: valueAt(kalshi, kalshiExact, timestamp),
  }));
}

// The value axis always includes zero and is padded by 15% of the range, never by less than $1,000.
export function valueDomain(series: readonly SeriesPoint[]): [number, number] {
  let min = 0;
  let max = 0;
  for (const p of series)
    for (const v of [p.poly, p.kalshi])
      if (v !== undefined) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
  const pad = Math.max(Math.abs(max - min) * 0.15, 1000);
  return [min - pad, max + pad];
}

// Roughly six date labels across the chart.
export const tickInterval = (points: number): number => Math.max(1, Math.floor(points / 6));

// Compact dollars. The sign rule is the original's: a plus for zero and gains; for losses the minus sits after the dollar mark ($-1.5K).
export function formatCompactUsd(value: number): string {
  const sign = value >= 0 ? "+" : "";
  if (Math.abs(value) >= 1e6) return `${sign}$${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${sign}$${(value / 1e3).toFixed(1)}K`;
  return `${sign}$${value.toFixed(0)}`;
}

export const formatTickDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const formatTooltipDate = (date: Date): string => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
