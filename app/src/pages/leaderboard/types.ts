import { z } from "zod";

// The original reads the response with no schema, so a field of the wrong type costs at most one cell.
// Parsing here is as forgiving: an optional field that is not of its type reads as absent, and a row is
// dropped only when it has no numeric P&L to show (where the original's own rendering throws). One bad
// row never rejects the list.
const text = z.string().nullish().catch(null);
const num = z.number().nullish().catch(null);

const smartScore = z.object({
  score: num,
  winRate: num,
  sharpeRatio: num,
  sharpe1d: num,
  sharpe1w: num,
  sharpe1m: num,
  maxDrawdownPercent: num,
  profitFactor: num,
  rSquared: num,
});

const dayMover = z.object({ label: z.string(), change: z.number(), icon: text });

const trader = z.object({
  // Only ever printed into test ids, so it is kept as sent.
  rank: z.union([z.number(), z.string()]).nullish().catch(undefined),
  name: z.string().catch(""),
  wallet: text,
  twitter: text,
  pfp: text,
  platform: text,
  polymarket_profile: text,
  kalshi_profile: text,
  kalshi_username: text,
  myriad_profile: text,
  myriad_username: text,
  hyperliquid_profile: text,
  stats: z.object({ pnl: z.number() }),
  join_date: text,
  smart_score: smartScore.nullish().catch(null),
  affiliated: z.boolean().nullish().catch(null),
  sports_share: num,
  esports_share: num,
  day_mover: dayMover.nullish().catch(null),
  // Absent and null are told apart by the ROI cell, so a value of the wrong type reads as absent.
  roi: z.number().nullish().catch(undefined),
});

/** The rows that can be shown; anything else in the list is skipped. */
export function parseTraders(rows: unknown): Trader[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const parsed = trader.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

export const leaderboardResponse = z
  .object({ traders: z.unknown().transform(parseTraders), lastUpdated: text })
  .catch({ traders: [], lastUpdated: null });
export const dailyProfitResponse = z.object({ daily_profit: z.string() });

export type Trader = z.infer<typeof trader>;
export type LeaderboardData = z.infer<typeof leaderboardResponse>;
export type DailyProfit = z.infer<typeof dailyProfitResponse>;

export type Period = "1d" | "1w" | "1m" | "1q" | "ytd" | "all";
export type PlatformFilter = "all" | "polymarket" | "kalshi" | "hyperliquid";
export type SortColumn = "pnl" | "score" | "r2" | "winrate" | "maxdd" | "pf" | "sharpe" | "roi" | "joined";
export type SortDirection = "asc" | "desc";
export type ExtraColumn = "sharpe" | "winrate" | "roi";

/** The `period` query value the API expects for each period button. */
export function apiPeriod(period: Period): string {
  switch (period) {
    case "1d": return "1d";
    case "1w": return "7d";
    case "1m": return "30d";
    case "1q": return "90d";
    case "ytd": return "ytd";
    case "all": return "all";
  }
}
