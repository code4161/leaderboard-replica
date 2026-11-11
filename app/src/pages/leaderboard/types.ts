import { z } from "zod";

const text = z.string().nullish();
const num = z.number().nullish();

const smartScore = z.object({
  score: z.number(),
  winRate: z.number(),
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
  rank: z.number(),
  name: z.string(),
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
  smart_score: smartScore.nullish(),
  affiliated: z.boolean().nullish(),
  sports_share: num,
  esports_share: num,
  day_mover: dayMover.nullish(),
  roi: num,
});

export const leaderboardResponse = z.object({ traders: z.array(trader), lastUpdated: text });
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
