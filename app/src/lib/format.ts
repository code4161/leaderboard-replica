// Number and date formats of the leaderboard pages.

const usd2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type Pnl = { full: string; compact: string };

/** P&L as shown in a table cell: `full` on wide screens, `compact` on narrow ones. A loss carries its minus after the dollar sign. */
export function formatPnl(value: number): Pnl {
  const sign = value >= 0 ? "+" : "";
  const abs = Math.abs(value);
  const full = `${sign}$${usd2(value)}`;
  let compact = full;
  if (abs >= 1e6) compact = `${sign}$${(value / 1e6).toFixed(1)}M`;
  else if (abs >= 1e5) compact = `${sign}$${(value / 1e3).toFixed(0)}k`;
  return { full, compact };
}

/** A signed, rounded dollar change: +$48K, -$1.2M, +$312. */
export function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${Math.round(abs / 1e3)}K`;
  return `${sign}$${Math.round(abs)}`;
}

/** ROI given as a fraction: one decimal under 10%, none above. */
export function formatRoi(fraction: number): string {
  const pct = fraction * 100;
  return `${pct >= 0 ? "+" : ""}${Math.abs(pct) < 10 ? pct.toFixed(1) : pct.toFixed(0)}%`;
}

/** What the ROI cell shows: null (a dash) only when the API sent no `roi` at all; an explicit null counts as zero. */
export function roiText(roi: number | null | undefined): string | null {
  return roi === undefined ? null : formatRoi(roi ?? 0);
}

/** Win rate given as a fraction, as a whole percentage. */
export function formatWinRate(fraction: number): string {
  return `${(fraction * 100).toFixed(0)}%`;
}

/** A join date is either "Oct 2025" (first of that month, local time) or anything Date can parse. Null when it is neither. */
export function parseJoinDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  let date: Date;
  if (value.includes(" ")) {
    const [month, year] = value.split(" ");
    date = new Date(parseInt(year), new Date(`${month} 1, ${year}`).getMonth(), 1);
  } else {
    date = new Date(value);
  }
  return isNaN(date.getTime()) ? null : date;
}

export type DaysAgo = { short: string; long: string };
const NO_DATE: DaysAgo = { short: "–", long: "–" };

export function daysAgo(value: string | null | undefined, now: Date = new Date()): DaysAgo {
  const date = parseJoinDate(value);
  if (!date) return NO_DATE;
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return { short: "0d", long: "today" };
  if (days === 1) return { short: "1d", long: "1 day ago" };
  return { short: `${days}d`, long: `${days} days ago` };
}

/** "Nov 12, 12:07 AM" in the visitor's locale and time zone; null for a missing or unparseable timestamp. */
export function formatUpdated(value: string | null | undefined, locale?: string, timeZone?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone });
}

const WALLET = /^0x[0-9a-fA-F]{40}$/;

export function isWallet(value: string | null | undefined): boolean {
  return !!value && WALLET.test(value);
}

/** A trader whose name is a bare wallet address is shown as 0x1234…abcd. */
export function displayName(name: string | null | undefined): string {
  if (!name) return "Unknown Trader";
  return WALLET.test(name) ? `${name.slice(0, 6)}…${name.slice(-4)}` : name;
}
