import { ThemeToggle } from "@/components/theme-toggle";
import { affiliatedLogo, hyperliquidLogo, kalshiLogo, polymarketLogo, xLogo } from "@/lib/logos";
import { sanitizeSearch } from "./filter-sort";
import type { ExtraColumn, Period, PlatformFilter } from "./types";

const ON = "bg-primary text-primary-foreground border-primary";
const OFF = "bg-background text-foreground border-border hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500";
const OFF_MUTED = "bg-background text-muted-foreground border-border hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500";
const SEGMENT_ON = "bg-primary text-primary-foreground";
const SEGMENT_OFF = "bg-background text-foreground hover:bg-gray-200 dark:hover:bg-gray-700";

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "ytd", label: "YTD" },
  { key: "1m", label: "1M" },
  { key: "1d", label: "1D" },
];

const PLATFORMS: { key: Exclude<PlatformFilter, "all">; name: string; title: string; logo: string }[] = [
  { key: "polymarket", name: "Polymarket", title: "Polymarket traders", logo: polymarketLogo },
  { key: "kalshi", name: "Kalshi", title: "Kalshi traders", logo: kalshiLogo },
  { key: "hyperliquid", name: "Hyperliquid", title: "Hyperliquid HIP-4 traders", logo: hyperliquidLogo },
];

const EXTRA_COLUMNS: { key: ExtraColumn; label: string; tip: string }[] = [
  { key: "sharpe", label: "Sharpe", tip: "Sharpe ratio (changes with selected period)" },
  { key: "winrate", label: "Win%", tip: "% of days with positive returns" },
  { key: "roi", label: "ROI", tip: "All-time Polymarket P&L / total amount staked across every position. Not affected by deposits, withdrawals or tips. Polymarket only." },
];

export type ControlsProps = {
  search: string;
  onSearch: (value: string) => void;
  shown: number;
  total: number;
  period: Period;
  onPeriod: (period: Period) => void;
  onPeriodIntent: (period: Period) => void;
  bigMoversOnly: boolean;
  onBigMovers: () => void;
  platform: PlatformFilter;
  onPlatform: (platform: PlatformFilter) => void;
  affiliatedOnly: boolean;
  onAffiliated: () => void;
  linkedOnly: boolean;
  onLinked: () => void;
  hideSports: boolean;
  onSports: () => void;
  hideEsports: boolean;
  onEsports: () => void;
  columns: ReadonlySet<ExtraColumn>;
  onColumn: (column: ExtraColumn) => void;
};

export function Controls(p: ControlsProps) {
  return (
    <div className="mb-5 space-y-3" data-testid="controls-section">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <input
            id="leaderboard-search"
            name="leaderboard-search"
            type="text"
            value={p.search}
            onChange={(e) => p.onSearch(sanitizeSearch(e.target.value))}
            placeholder="Search traders..."
            maxLength={50}
            autoComplete="off"
            spellCheck={false}
            className="px-3 py-1 border border-border bg-background text-foreground text-sm w-full sm:w-48 focus:ring-2 focus:ring-ring"
            data-testid="input-search"
          />
          <div className="text-sm text-foreground" data-testid="results-count">
            {p.shown} of {p.total} traders
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {p.search && (
            <button
              onClick={() => p.onSearch("")}
              className="text-sm px-2 py-1 border border-border hover:bg-primary hover:text-primary-foreground "
              data-testid="button-clear-search"
            >
              Clear
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">P&L:</span>
          <div className="flex gap-1" data-testid="period-selector">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => p.onPeriod(key)}
                onMouseEnter={() => p.onPeriodIntent(key)}
                onFocus={() => p.onPeriodIntent(key)}
                className={`px-2.5 sm:px-3 py-1 border text-xs sm:text-sm font-medium  whitespace-nowrap ${p.period === key ? ON : OFF}`}
                data-testid={`button-period-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
          {p.period === "1d" && (
            <button
              onClick={p.onBigMovers}
              className={`px-2 sm:px-2.5 py-1 border text-xs sm:text-sm  whitespace-nowrap ${p.bigMoversOnly ? ON : OFF}`}
              data-testid="button-big-movers-filter"
              title={p.bigMoversOnly ? "Showing traders with ±$5+ daily P&L" : "Click to filter to big movers only"}
            >
              $5+
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap" data-testid="platform-filter">
          <div className="flex items-center gap-1 border border-border rounded-sm overflow-hidden">
            {PLATFORMS.map(({ key, name, title, logo }) => (
              <button
                key={key}
                onClick={() => p.onPlatform(key)}
                className={`px-2 py-1 flex items-center gap-1 text-xs sm:text-sm  ${p.platform === key ? SEGMENT_ON : SEGMENT_OFF}`}
                data-testid={`button-platform-${key}`}
                title={title}
              >
                <img src={logo} alt="" className="w-5 h-5" />
                <span className="sr-only">{name}</span>
              </button>
            ))}
            <button
              onClick={() => p.onPlatform("all")}
              className={`px-2 py-1 text-xs sm:text-sm  ${p.platform === "all" ? SEGMENT_ON : SEGMENT_OFF}`}
              data-testid="button-platform-all"
              title="All platforms"
            >
              All
            </button>
          </div>
          <button
            onClick={p.onAffiliated}
            className={`p-1 border text-xs sm:text-sm  flex items-center justify-center min-w-[28px] min-h-[28px] flex-shrink-0 ${p.affiliatedOnly ? ON : OFF}`}
            data-testid="button-affiliated-filter"
            title={p.affiliatedOnly ? "Showing our affiliated traders" : "Click to show our traders"}
          >
            <img src={affiliatedLogo} alt="PT" className="w-5 h-5 rounded-full" loading="eager" decoding="sync" />
          </button>
          <button
            onClick={p.onLinked}
            className={`px-2 py-1 border text-xs sm:text-sm  flex items-center gap-1 whitespace-nowrap ${p.linkedOnly ? ON : OFF}`}
            data-testid="button-twitter-filter"
            title={p.linkedOnly ? "Showing traders with Twitter only" : "Showing all traders"}
          >
            <img src={xLogo} alt="" className="w-3.5 h-3.5" />
            <span className="text-xs">linked</span>
          </button>
          <button
            onClick={p.onSports}
            className={`px-2 py-1 border text-xs sm:text-sm whitespace-nowrap ${p.hideSports ? ON : OFF}`}
            data-testid="button-sports-filter"
            title={p.hideSports ? "Hiding traders who make most of their profit on sports" : "Showing sports traders"}
          >
            <span className="text-xs">No sports</span>
          </button>
          <button
            onClick={p.onEsports}
            className={`px-2 py-1 border text-xs sm:text-sm whitespace-nowrap ${p.hideEsports ? ON : OFF}`}
            data-testid="button-esports-filter"
            title={p.hideEsports ? "Hiding esports traders without an X account" : "Showing esports traders"}
          >
            <span className="text-xs">No esports</span>
          </button>
          <div className="hidden sm:flex gap-1 ml-1">
            {EXTRA_COLUMNS.map(({ key, label, tip }) => (
              <button
                key={key}
                title={tip}
                onClick={() => p.onColumn(key)}
                className={`px-2 py-1 border text-xs  ${p.columns.has(key) ? ON : OFF_MUTED}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
