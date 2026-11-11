// Calendar maths: daily P&L from the cumulative history, one month's grid and totals, and the year by month.

export type CumulativePoint = { timestamp: number; pnl: number };

const GAP_MS = 36 * 60 * 60 * 1000;

/**
 * Daily P&L is the change between consecutive points, booked to the UTC day the later point closes
 * (one second back, so a midnight snapshot counts for the day that just ended). A gap longer than
 * 36 hours is skipped: its change cannot be given to one day.
 */
export function dailyPnl(history: CumulativePoint[] | undefined): { days: Map<string, number>; start: Date | null } {
  if (!history || history.length < 2) return { days: new Map(), start: null };
  const days = new Map<string, number>();
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = sorted[i - 1];
    if (cur.timestamp - prev.timestamp > GAP_MS) continue;
    const key = new Date(cur.timestamp - 1000).toISOString().split("T")[0];
    days.set(key, (days.get(key) || 0) + (cur.pnl - prev.pnl));
  }
  return { days, start: new Date(sorted[0].timestamp) };
}

export type MonthView = {
  year: number;
  month: number;
  label: string;
  isCurrent: boolean;
  canGoBack: boolean;
  daysInMonth: number;
  /** Day shown last: today in the current month, else the month's last day. */
  lastDay: number;
  /** Leading blanks then day numbers, for a Sunday-first grid. */
  cells: (number | null)[];
  total: number;
  winDays: number;
  lossDays: number;
  tradingDays: number;
  bestDay: number;
  bestPnl: number;
  pnlOn: (day: number) => number | null;
  isFuture: (day: number) => boolean;
  isBeforeStart: (day: number) => boolean;
  isStart: (day: number) => boolean;
  /**
   * Days in the collapsed strip. As on the original, there are min(lastDay, 14) slots starting 13 days
   * before lastDay, so before the 14th the strip stops short of lastDay (on the 10th it shows days 1 to 6).
   */
  stripDays: number[];
};

export function monthView(days: Map<string, number>, start: Date | null, now: Date, offset: number): MonthView {
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrent = offset === 0;
  const lastDay = isCurrent ? now.getDate() : daysInMonth;
  const pnlOn = (day: number) => days.get(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`) ?? null;
  const isBeforeStart = (day: number) => (start ? new Date(year, month, day) < new Date(start.getFullYear(), start.getMonth(), start.getDate()) : false);

  let total = 0, winDays = 0, lossDays = 0, tradingDays = 0, bestDay = -1, bestPnl = -Infinity;
  for (let d = 1; d <= lastDay; d++) {
    const v = pnlOn(d);
    if (v === null) continue;
    total += v;
    tradingDays++;
    if (v > 0) winDays++;
    else if (v < 0) lossDays++;
    if (v > bestPnl) { bestPnl = v; bestDay = d; }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const stripDays: number[] = [];
  for (let i = 0; i < Math.min(lastDay, 14); i++) {
    const d = lastDay - 13 + i;
    if (d >= 1 && !isBeforeStart(d)) stripDays.push(d);
  }

  return {
    year, month, isCurrent, daysInMonth, lastDay, cells, total, winDays, lossDays, tradingDays, bestDay, bestPnl, pnlOn, isBeforeStart, stripDays,
    label: first.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    canGoBack: start ? year > start.getFullYear() || (year === start.getFullYear() && month > start.getMonth()) : true,
    isFuture: (day) => (isCurrent ? day > now.getDate() : false),
    isStart: (day) => (start ? year === start.getFullYear() && month === start.getMonth() && day === start.getDate() : false),
  };
}

export type MonthTotal = { total: number; hasData: boolean };

export function yearByMonth(days: Map<string, number>, year: number): { months: MonthTotal[]; ytd: number; bestMonth: number } {
  const months: MonthTotal[] = Array.from({ length: 12 }, () => ({ total: 0, hasData: false }));
  days.forEach((v, key) => {
    const d = new Date(`${key}T00:00:00`);
    if (d.getFullYear() === year) {
      months[d.getMonth()].total += v;
      months[d.getMonth()].hasData = true;
    }
  });
  let bestMonth = -1, best = 0;
  months.forEach((m, i) => {
    if (m.hasData && m.total > best) { best = m.total; bestMonth = i; }
  });
  return { months, ytd: months.reduce((s, m) => s + (m.hasData ? m.total : 0), 0), bestMonth };
}

export function dayColour(pnl: number | null, isBest: boolean): string {
  if (pnl === null) return "bg-muted/30";
  if (isBest) return "bg-yellow-500/60";
  if (Math.abs(pnl) < 100) return "bg-muted/40";
  if (pnl >= 1e4) return "bg-green-600/60";
  if (pnl >= 5e3) return "bg-green-500/50";
  if (pnl >= 2e3) return "bg-green-500/40";
  if (pnl >= 500) return "bg-green-500/30";
  if (pnl > 0) return "bg-green-500/20";
  if (pnl <= -1e4) return "bg-red-600/60";
  if (pnl <= -5e3) return "bg-red-500/50";
  if (pnl <= -2e3) return "bg-red-500/40";
  if (pnl <= -500) return "bg-red-500/30";
  return "bg-red-500/20";
}

export function dayTextColour(pnl: number | null, isBest: boolean): string {
  if (pnl === null) return "text-muted-foreground/50";
  if (isBest) return "text-yellow-600 dark:text-yellow-400";
  if (Math.abs(pnl) < 100) return "text-muted-foreground";
  return pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
}

export function monthColour(m: MonthTotal, isBest: boolean): string {
  if (!m.hasData) return "bg-muted/20";
  if (isBest) return "bg-green-500/40";
  if (m.total >= 1e4) return "bg-green-500/25";
  if (m.total > 0) return "bg-green-500/10";
  if (m.total < 0) return "bg-red-500/15";
  return "bg-muted/30";
}

/** The six most recent UTC months, newest first, for the share cards. */
export function recentMonths(now: Date, count = 6): { value: string; short: string; long: string; name: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      short: d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
      long: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      name: d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }),
    };
  });
}
