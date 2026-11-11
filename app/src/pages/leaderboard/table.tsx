import { useState } from "react";
import { avatarInitial, smallAvatar } from "@/lib/avatar";
import { openExternal, safeExternalUrl } from "@/lib/safe-url";
import { daysAgo, displayName, formatChange, formatPnl, formatWinRate, roiText } from "@/lib/format";
import { affiliatedLogo, hyperliquidLogo, kalshiLogo, polymarketLogo, xLogo } from "@/lib/logos";
import { accountHref, scoreColor, sharpeColor, sharpeFor, sharpeWindow, sortIndicator, twitterUrl, winRateColor } from "./filter-sort";
import { myriadLogo } from "./myriad-logo";
import { polymarketProfileUrl, withVia } from "./referral";
import type { ExtraColumn, Period, SortColumn, SortDirection, Trader } from "./types";

type Sizes = { text: string; joined: string; score: string; avatar: string; name: string; mark: string };

// Every extra column shrinks the type so the row still fits.
function sizes(extraColumns: number): Sizes {
  const dense = extraColumns > 0;
  return {
    text: dense ? "text-xs sm:text-base" : "text-sm sm:text-lg",
    joined: dense ? "text-xs sm:text-base" : "text-base sm:text-lg",
    score: extraColumns === 0 ? "text-lg sm:text-xl" : extraColumns === 1 ? "text-base sm:text-lg" : "text-xs sm:text-sm",
    avatar: dense ? "w-5 h-5 sm:w-8 sm:h-8" : "w-6 h-6 sm:w-10 sm:h-10",
    name: dense ? "max-w-[50px] sm:max-w-[80px] md:max-w-[120px] text-xs sm:text-base" : "max-w-[60px] sm:min-w-[80px] sm:max-w-none text-sm sm:text-lg",
    mark: dense ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6",
  };
}

const INITIAL = "w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary";

function Avatar({ trader }: { trader: Trader }) {
  const [failed, setFailed] = useState(false);
  if (!trader.pfp) {
    return <div className={INITIAL} data-testid={`avatar-trader-${trader.rank}`}>{trader.name.charAt(0).toUpperCase()}</div>;
  }
  if (failed) return <div className={INITIAL}>{avatarInitial(trader.name)}</div>;
  return (
    <img
      src={smallAvatar(trader.pfp)}
      alt={trader.name || "Trader"}
      className="w-full h-full rounded-full object-cover"
      style={{ aspectRatio: "1 / 1" }}
      loading="lazy"
      data-testid={`avatar-img-trader-${trader.rank}`}
      onError={() => setFailed(true)}
    />
  );
}

function TraderName({ trader, className }: { trader: Trader; className: string }) {
  const testid = `text-trader-name-${trader.rank}`;
  const label = displayName(trader.name);
  const href = accountHref(trader);
  if (href) return <a href={href} className={className} data-testid={testid}>{label}</a>;
  if ((trader.platform || "polymarket") === "myriad" && trader.wallet) {
    return (
      <a href={`https://myriad.markets/profile/${encodeURIComponent(trader.wallet)}`} target="_blank" rel="noopener noreferrer" className={className} data-testid={testid}>
        {label}
      </a>
    );
  }
  return <span className={className} data-testid={testid}>{label}</span>;
}

function Marks({ trader: t, size }: { trader: Trader; size: string }) {
  const button = `${size} flex items-center justify-center hover:opacity-70 `;
  const round = `${size} object-cover rounded-full`;
  const x = twitterUrl(t.twitter);
  const onPolymarket = (t.platform === "both" || t.platform === "polymarket" || !!t.polymarket_profile) && !!t.wallet;
  const onKalshi = !!t.kalshi_username || !!t.kalshi_profile;
  const onMyriad = (!!t.myriad_profile || !!t.myriad_username || t.platform === "myriad") && (!!t.myriad_username || !!t.myriad_profile || !!t.wallet);
  return (
    <div className="flex gap-0.5 sm:gap-1 ml-0.5 sm:ml-1.5 flex-shrink-0">
      {t.affiliated && (
        <div className={`${size} flex items-center justify-center flex-shrink-0`} title="Predicting.top Affiliated Trader">
          <img src={affiliatedLogo} alt="PT" className={round} loading="eager" decoding="sync" />
        </div>
      )}
      {x && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openExternal(x);
          }}
          className={button}
          data-testid={`button-twitter-${t.rank}`}
        >
          <img src={xLogo} alt="X" className={`${size} object-cover`} />
        </button>
      )}
      {onPolymarket && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openExternal(safeExternalUrl(t.polymarket_profile) ?? polymarketProfileUrl(t.wallet, null) ?? withVia("https://polymarket.com"));
          }}
          className={button}
          data-testid={`button-polymarket-${t.rank}`}
        >
          <img src={polymarketLogo} alt="Polymarket" className={round} />
        </button>
      )}
      {onKalshi && (
        <a href={`/account/${encodeURIComponent(String(t.kalshi_username))}`} onClick={(e) => e.stopPropagation()} className={button} data-testid={`button-kalshi-${t.rank}`}>
          <img src={kalshiLogo} alt="Kalshi" className={round} />
        </a>
      )}
      {t.hyperliquid_profile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openExternal(t.hyperliquid_profile);
          }}
          className={button}
          data-testid={`button-hyperliquid-${t.rank}`}
          title="View on Outcome (Hyperliquid HIP-4)"
        >
          <img src={hyperliquidLogo} alt="Hyperliquid" className={round} />
        </button>
      )}
      {onMyriad && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openExternal(t.myriad_profile || `https://myriad.markets/profile/${encodeURIComponent(String(t.wallet))}`);
          }}
          className={button}
          data-testid={`button-myriad-${t.rank}`}
        >
          <img src={myriadLogo} alt="Myriad" className={round} />
        </button>
      )}
    </div>
  );
}

function PnlCell({ trader, period }: { trader: Trader; period: Period }) {
  const pnl = formatPnl(trader.stats.pnl);
  const mover = period === "1d" ? trader.day_mover : null;
  return (
    <>
      <span className="hidden sm:inline">{pnl.full}</span>
      <span className="sm:hidden">{pnl.compact}</span>
      {mover && (
        <div
          className="flex items-center justify-end gap-1 text-[10px] sm:text-xs font-normal text-muted-foreground"
          title={`Biggest move today: ${mover.label} ${formatPnl(mover.change).full}`}
        >
          {mover.icon ? (
            <img src={mover.icon} alt={mover.label} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm object-cover" loading="lazy" />
          ) : (
            <span className="truncate max-w-[80px] sm:max-w-[120px]">{mover.label}</span>
          )}
          <span className={mover.change >= 0 ? "text-green-500" : "text-red-500"}>{formatChange(mover.change)}</span>
        </div>
      )}
    </>
  );
}

const DASH = "–";

export type TableProps = {
  traders: readonly Trader[];
  period: Period;
  columns: ReadonlySet<ExtraColumn>;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  /** True while a newer response for the table is on its way: P&L cells show a placeholder. */
  refreshing: boolean;
};

export function LeaderboardTable({ traders, period, columns, sortColumn, sortDirection, onSort, refreshing }: TableProps) {
  const s = sizes(columns.size);
  const arrow = (column: SortColumn) => sortIndicator(sortColumn, sortDirection, column);
  const sharpe = sharpeWindow(period);
  const extraHeader = `text-center p-1 sm:p-2 font-normal text-foreground hidden sm:table-cell cursor-pointer hover:bg-muted whitespace-nowrap ${s.score}`;
  return (
    <table className="w-full border-collapse table-fixed" data-testid="leaderboard-table">
      <thead>
        <tr className="border-b border-border">
          <th className={`text-left p-1 sm:p-3 font-normal text-foreground w-6 sm:w-12 ${s.text}`}>#</th>
          <th className="p-0.5 sm:p-2 font-normal text-foreground w-7 sm:w-14" />
          <th className={`text-left p-1 sm:p-3 font-normal text-foreground md:min-w-[280px] ${s.text}`}>Trader</th>
          <th
            className={`text-left p-2 font-normal text-foreground hidden md:table-cell whitespace-nowrap w-16 cursor-pointer hover:bg-muted ${s.joined}`}
            onClick={() => onSort("joined")}
          >
            Joined{arrow("joined")}
          </th>
          <th
            className={`text-center p-1 sm:p-2 font-normal text-foreground cursor-pointer hover:bg-muted whitespace-nowrap ${s.score}`}
            onClick={() => onSort("score")}
          >
            Score{arrow("score")}
          </th>
          {columns.has("sharpe") && (
            <th className={extraHeader} onClick={() => onSort("sharpe")} title={`Sharpe ratio - ${sharpe.title}`}>
              Sharpe {sharpe.header}{arrow("sharpe")}
            </th>
          )}
          {columns.has("winrate") && (
            <th className={extraHeader} onClick={() => onSort("winrate")} title="Win Rate - % of profitable days">
              Win%{arrow("winrate")}
            </th>
          )}
          {columns.has("roi") && (
            <th className={extraHeader} onClick={() => onSort("roi")} title="Return on Investment: All-time P&L / Total Deposited">
              ROI{arrow("roi")}
            </th>
          )}
          <th
            className={`text-right p-1 sm:p-2 font-normal text-foreground cursor-pointer hover:bg-muted whitespace-nowrap ${s.text}`}
            data-testid="header-pnl"
            onClick={() => onSort("pnl")}
          >
            P&L{arrow("pnl")}
          </th>
        </tr>
      </thead>
      <tbody>
        {traders.map((t, i) => {
          const score = t.smart_score;
          const traderSharpe = sharpeFor(t, period);
          const roi = roiText(t.roi);
          return (
            <tr
              key={`${t.platform}-${t.wallet || t.kalshi_username || t.name}`}
              className="border-b border-border cursor-pointer hover:bg-accent/50"
              data-testid={`row-trader-${i + 1}`}
            >
              <td className={`p-1 sm:p-3 ${s.text}`} data-testid={`text-rank-${i + 1}`}>{i + 1}</td>
              <td className="p-0.5 sm:p-2" data-testid={`cell-avatar-${t.rank}`}>
                <div className={`flex-shrink-0 ${s.avatar}`} style={{ minWidth: "20px", minHeight: "20px" }}>
                  <Avatar trader={t} />
                </div>
              </td>
              <td className="p-1 sm:p-2 md:min-w-[280px]" data-testid={`cell-trader-${t.rank}`}>
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 overflow-hidden">
                  <TraderName trader={t} className={`no-underline text-foreground hover:underline truncate min-w-0 ${s.name}`} />
                  <Marks trader={t} size={s.mark} />
                </div>
              </td>
              <td className={`p-2 text-left hidden md:table-cell text-muted-foreground whitespace-nowrap w-16 ${s.joined}`}>
                {daysAgo(t.join_date).short}
              </td>
              <td className="p-1 sm:p-2 text-center" title="Overall score 0-100">
                {score ? (
                  <span className={`font-medium ${scoreColor(score.score ?? 0)} ${s.score}`}>{score.score}</span>
                ) : (
                  <span className={`text-muted-foreground/40 ${s.score}`}>{DASH}</span>
                )}
              </td>
              {columns.has("sharpe") && (
                <td className="p-1 text-center hidden sm:table-cell" title={`Sharpe Ratio - ${sharpe.title}`} data-testid={`sharpe-${t.wallet || t.kalshi_username}`}>
                  {traderSharpe != null ? (
                    <span className={`${s.score} ${sharpeColor(traderSharpe)}`}>{traderSharpe.toFixed(2)}</span>
                  ) : (
                    <span className={`${s.score} text-muted-foreground/40`}>{DASH}</span>
                  )}
                </td>
              )}
              {columns.has("winrate") && (
                <td className="p-1 text-center hidden sm:table-cell" title="% of days with profit">
                  {score ? (
                    <span className={`${s.score} ${winRateColor(score.winRate ?? 0)}`}>{formatWinRate(Number(score.winRate))}</span>
                  ) : (
                    <span className={`${s.score} text-muted-foreground/40`}>{DASH}</span>
                  )}
                </td>
              )}
              {columns.has("roi") && (
                <td className={`p-1 sm:p-2 text-center hidden sm:table-cell whitespace-nowrap ${s.score}`}>
                  {roi !== null ? (
                    <span className={(t.roi ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{roi}</span>
                  ) : (
                    <span className="text-muted-foreground/40">{DASH}</span>
                  )}
                </td>
              )}
              <td className={`p-1 sm:p-2 text-right text-foreground font-medium whitespace-nowrap ${s.text}`} data-testid={`text-pnl-${t.rank}`}>
                {refreshing ? <div className="h-4 sm:h-5 w-14 sm:w-16 bg-muted  rounded inline-block" /> : <PnlCell trader={t} period={period} />}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      <td className="p-2"><div className="h-4 w-6 bg-muted  rounded" /></td>
      <td className="p-2"><div className="w-8 h-8 bg-muted  rounded-full" /></td>
      <td className="p-2"><div className="h-4 w-24 bg-muted  rounded" /></td>
      <td className="p-2"><div className="h-4 w-20 bg-muted  rounded" /></td>
    </tr>
  );
}

const SKELETON_TH = "p-2 text-left text-sm font-medium text-muted-foreground";

/** What the page shows until the first leaderboard response arrives. */
export function LeaderboardSkeleton({ heading, subtitle }: { heading: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-5">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl font-normal text-foreground">{heading}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-20 bg-muted  rounded" />
            <div className="h-8 w-28 bg-muted  rounded" />
            <div className="h-8 w-20 bg-muted  rounded" />
          </div>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className={SKELETON_TH}>#</th>
                <th className={SKELETON_TH} />
                <th className={SKELETON_TH}>Trader</th>
                <th className={SKELETON_TH}>P&L</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
