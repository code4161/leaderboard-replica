// Number, date and label formats of the trader profile. Each one is used in a single place on the
// page and they round differently, so they stay separate functions.

const sign = (n: number) => (n >= 0 ? "+" : "-");

/** Document title and meta: "+$4.92M", "+$1.2K", "$-950" keeps the raw sign of a negative value. */
export function titlePnl(n: number): string {
  const s = n >= 0 ? "+" : "";
  if (Math.abs(n) >= 1e6) return `${s}$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${s}$${(n / 1e3).toFixed(1)}K`;
  return `${s}$${n.toFixed(0)}`;
}

/** Bar chart axis and tooltip (P&L Overview). */
export function overviewPnl(n: number): string {
  const s = n >= 0 ? "+" : "";
  if (Math.abs(n) >= 1e6) return `${s}$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${s}$${(n / 1e3).toFixed(0)}K`;
  return `${s}$${n.toFixed(0)}`;
}

/** Line chart axis and tooltip (P&L History). */
export function chartPnl(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `${sign(n)}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign(n)}$${(a / 1e3).toFixed(0)}K`;
  return `${sign(n)}$${a.toFixed(0)}`;
}

/** P&L by category rows and the 24h change line. */
export function categoryPnl(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `${sign(n)}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign(n)}$${(a / 1e3).toFixed(1)}K`;
  return `${sign(n)}$${a.toFixed(0)}`;
}

/** Share text amount, unsigned: "$4.92M", "$292K", "$12.3K", "$950". */
export function shareAmount(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`;
  return `$${Math.round(a).toLocaleString("en-US")}`;
}

export const upDown = (n: number) => `${n < 0 ? "down" : "up"} ${shareAmount(n)}`;

/** Calendar month total and day tooltips: whole dollars with separators. */
export function wholeDollars(n: number): string {
  return `${n >= 0 ? "+$" : "-$"}${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
}

/** Calendar day cell and strip tooltip. */
export function dayPnl(n: number): string {
  const a = Math.abs(n);
  return a >= 1e3 ? `${sign(n)}$${(a / 1e3).toFixed(1)}K` : `${sign(n)}$${Math.round(a)}`;
}

/** Monthly grid and year-to-date figure. */
export function monthPnl(n: number): string {
  const p = n >= 0 ? "+$" : "-$";
  const a = Math.abs(n);
  if (a >= 1e6) return `${p}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${p}${(a / 1e3).toFixed(2)}K`;
  return `${p}${Math.round(a)}`;
}

export const shortWallet = (w: string) => (w.length <= 12 ? w : `${w.slice(0, 6)}...${w.slice(-4)}`);

/** "Oct 2025" and "October 2025" stay month and year; anything else is parsed as a date. */
export function joinDate(raw: string): string {
  const m = raw.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m) {
    const mon = m[1].slice(0, 3);
    return `${mon.charAt(0).toUpperCase()}${mon.slice(1).toLowerCase()} ${m[2]}`;
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function platformLabel(platform: string | null | undefined): string {
  switch (platform) {
    case "kalshi": return "Kalshi";
    case "myriad": return "Myriad";
    case "hyperliquid": return "Hyperliquid";
    case "both": return "Polymarket & Kalshi";
    default: return "Polymarket";
  }
}

/** Platform name as it reads inside a share sentence. */
export function sharePlatform(platform: string | null | undefined): string {
  switch (platform) {
    case "kalshi": return "Kalshi";
    case "both": return "Polymarket and Kalshi";
    case "hyperliquid": return "Hyperliquid";
    default: return "Polymarket";
  }
}

export const isWalletAddress = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s);

/**
 * A fraction as a percentage figure, the way the original's arithmetic treats a missing value: null
 * counts as zero ("0", "0.0") and an absent field gives "NaN".
 */
export function percent(fraction: number | null | undefined, digits: number): string {
  return (Number(fraction) * 100).toFixed(digits);
}
