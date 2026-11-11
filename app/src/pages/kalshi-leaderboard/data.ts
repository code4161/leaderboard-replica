import { z } from "zod";

export const PERIODS = [
  { key: "all", label: "ALL" },
  { key: "30d", label: "1M" },
  { key: "7d", label: "7D" },
  { key: "1d", label: "1D" },
] as const;
export type Period = (typeof PERIODS)[number]["key"];

export const PAGE_SIZE = 100;

const traderSchema = z.object({
  rank: z.number(),
  kalshi_username: z.string(),
  name: z.string(),
  pfp: z.string().nullish(),
  profile_path: z.string().nullish(),
  kalshi_url: z.string(),
  pnl: z.number(),
});
export type KalshiTrader = z.infer<typeof traderSchema>;

export const kalshiLeaderboardSchema = z.object({
  tracked: z.number().nullish(),
  lastUpdated: z.string().nullish(),
  traders: z.array(traderSchema).nullish(),
});
export type KalshiLeaderboard = z.infer<typeof kalshiLeaderboardSchema>;

export function kalshiLeaderboardUrl(period: Period, nonSports: boolean): string {
  return `/api/kalshi-leaderboard?period=${period}&limit=1000${nonSports ? "&nonSports=1" : ""}`;
}

export async function fetchKalshiLeaderboard(period: Period, nonSports: boolean): Promise<KalshiLeaderboard> {
  const res = await fetch(kalshiLeaderboardUrl(period, nonSports));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return kalshiLeaderboardSchema.parse(await res.json());
}

// Whole dollars with a sign in front of the dollar mark: +$7,758,129, -$1,204, +$0.
export function formatPnl(value: number): string {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// Case-insensitive match on the display name or the Kalshi username; a blank search keeps every row.
export function filterTraders(traders: readonly KalshiTrader[], search: string): readonly KalshiTrader[] {
  const q = search.trim().toLowerCase();
  if (!q) return traders;
  return traders.filter((t) => t.name.toLowerCase().includes(q) || t.kalshi_username.toLowerCase().includes(q));
}

export function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const KALSHI_GUIDE = {
  path: "/kalshi",
  title: "Kalshi Leaderboard — Top 1,000 Kalshi Traders by Profit | predicting.top",
  heading: "Kalshi Leaderboard",
  intro:
    "This Kalshi leaderboard ranks the top 1,000 Kalshi traders by profit over the last day, week, month and all time. P&L is snapshotted every two hours, so you can see how each trader's profit changes over time, by category as well as in total.",
  faq: [
    {
      q: "What is the Kalshi leaderboard?",
      a: "A ranking of Kalshi traders by profit. predicting.top tracks the top 1,000 Kalshi traders from their public Kalshi profiles and ranks them by daily, weekly, monthly and all-time profit.",
    },
    {
      q: "Do I need a Kalshi account to see it?",
      a: "No. Kalshi's own leaderboard lives inside Kalshi and traders have to opt in to appear on it. This page is public and needs no account.",
    },
    {
      q: "How are daily, weekly and monthly Kalshi profits measured?",
      a: "predicting.top records every tracked trader's Kalshi P&L every two hours. Daily, weekly and monthly profit is the change between those snapshots, so it fills in over the first days a trader is tracked.",
    },
    {
      q: "Can I see a Kalshi trader's P&L history?",
      a: "Yes. Each trader's profile shows their Kalshi P&L over time and their profit by category, such as politics, economics or sports.",
    },
    {
      q: "How do I get my Kalshi account on the leaderboard?",
      a: "Make your Kalshi profile public and submit your Kalshi username on the Get Listed page.",
    },
  ],
} as const;
