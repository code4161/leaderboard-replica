import { parseJoinDate } from "@/lib/format";
import type { Period, PlatformFilter, SortColumn, SortDirection, Trader } from "./types";

export type Filters = {
  platform: PlatformFilter;
  affiliatedOnly: boolean;
  linkedOnly: boolean;
  hideSports: boolean;
  hideEsports: boolean;
  search: string;
  period: Period;
  bigMoversOnly: boolean;
};

/** What the search box keeps of what is typed: 50 characters of letters, digits, spaces, underscore and hyphen. */
export function sanitizeSearch(raw: string): string {
  return raw.slice(0, 50).replace(/[^a-zA-Z0-9\s_-]/g, "");
}

export function matchesFilters(t: Trader, f: Filters): boolean {
  if (f.platform !== "all") {
    const platform = t.platform || "polymarket";
    if (platform === "both") {
      if (f.platform !== "polymarket" && f.platform !== "kalshi") return false;
    } else if (platform !== f.platform) return false;
  }
  const linked = !!t.twitter?.trim();
  if (f.hideSports && (t.sports_share ?? 0) >= 0.5) return false;
  if (f.hideEsports && (t.esports_share ?? 0) >= 0.5 && !linked) return false;
  if (f.linkedOnly && !linked) return false;
  if (f.affiliatedOnly && !t.affiliated) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const hit =
      t.name.toLowerCase().includes(q) ||
      !!t.wallet?.toLowerCase().includes(q) ||
      !!t.kalshi_username?.toLowerCase().includes(q);
    if (!hit) return false;
  }
  // The $5+ button only applies to the daily view.
  if (f.period === "1d" && f.bigMoversOnly && Math.abs(t.stats.pnl) < 5) return false;
  return true;
}

/** The Sharpe figure that goes with the selected period. */
export function sharpeFor(t: Trader, period: Period): number | null | undefined {
  const s = t.smart_score;
  if (period === "1d") return s?.sharpe1d;
  if (period === "1w") return s?.sharpe1w;
  if (period === "1m") return s?.sharpe1m;
  return s?.sharpeRatio;
}

/** The label that follows "Sharpe" in the column header, and the one used in its tooltip. */
export function sharpeWindow(period: Period): { header: string; title: string } {
  const header = period === "1d" ? "3D" : period === "1w" ? "7D" : period === "1m" ? "30D" : "";
  return { header, title: header || "All time" };
}

export function sortValue(t: Trader, column: SortColumn, period: Period): number {
  const s = t.smart_score;
  switch (column) {
    case "pnl": return t.stats.pnl;
    case "score": return s?.score ?? 0;
    case "r2": return s?.rSquared ?? 0;
    case "winrate": return s?.winRate ?? 0;
    case "maxdd": return s?.maxDrawdownPercent ?? 0;
    case "pf": return s?.profitFactor ?? 0;
    case "sharpe": return sharpeFor(t, period) ?? 0;
    case "roi": return t.roi ?? -Infinity;
    case "joined": return parseJoinDate(t.join_date)?.getTime() ?? 0;
  }
}

/** Filtered traders in API order, or ordered by `column` when one is chosen. The sort is stable, so ties keep API order. */
export function selectTraders(
  traders: readonly Trader[],
  filters: Filters,
  column: SortColumn | null,
  direction: SortDirection,
): Trader[] {
  const kept = traders.filter((t) => matchesFilters(t, filters));
  if (!column) return kept;
  return kept.sort((a, b) => {
    const x = sortValue(a, column, filters.period);
    const y = sortValue(b, column, filters.period);
    return direction === "asc" ? x - y : y - x;
  });
}

/** Clicking a header sorts ascending first; clicking the sorted header again flips it. */
export function nextDirection(current: SortColumn | null, direction: SortDirection, clicked: SortColumn): SortDirection {
  return current === clicked && direction === "asc" ? "desc" : "asc";
}

export function sortIndicator(current: SortColumn | null, direction: SortDirection, column: SortColumn): string {
  if (current !== column) return "";
  return direction === "asc" ? " ↓" : " ↑";
}

// The X link builder is shared with the trader profile.
export { twitterUrl } from "@/lib/twitter";

/** The trader's profile page on this site, when there is one. The id is one path segment, so it is encoded. */
export function accountHref(t: Trader): string | null {
  const id = t.platform === "kalshi" && t.kalshi_username ? t.kalshi_username : t.wallet || t.kalshi_username;
  return id ? `/account/${encodeURIComponent(id)}` : null;
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-700 dark:text-green-400";
  if (score >= 65) return "text-green-600 dark:text-green-500";
  if (score >= 50) return "text-lime-600 dark:text-lime-400";
  if (score >= 35) return "text-orange-500 dark:text-orange-400";
  return "text-red-600 dark:text-red-500";
}

export function winRateColor(rate: number): string {
  if (rate >= 0.65) return "text-green-700 dark:text-green-400";
  if (rate >= 0.55) return "text-green-600 dark:text-green-500";
  if (rate >= 0.45) return "text-lime-600 dark:text-lime-400";
  if (rate >= 0.35) return "text-orange-500 dark:text-orange-400";
  return "text-red-600 dark:text-red-500";
}

export function sharpeColor(sharpe: number): string {
  if (sharpe >= 2) return "text-green-700 dark:text-green-400";
  if (sharpe >= 1.5) return "text-green-600 dark:text-green-500";
  if (sharpe >= 1) return "text-lime-600 dark:text-lime-400";
  if (sharpe >= 0.5) return "text-orange-500 dark:text-orange-400";
  return "text-red-600 dark:text-red-500";
}
