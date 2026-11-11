import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ReplicaNotice } from "@/components/replica-notice";
import { ThemeToggle } from "@/components/theme-toggle";
import { smallAvatar } from "./kalshi-leaderboard/avatar";
import {
  fetchKalshiLeaderboard,
  filterTraders,
  formatPnl,
  formatUpdated,
  KALSHI_GUIDE,
  PAGE_SIZE,
  PERIODS,
  type KalshiTrader,
  type Period,
} from "./kalshi-leaderboard/data";
import { LeaderboardGuide } from "./kalshi-leaderboard/guide";
import { retryDelay, retryNetworkOnly } from "./kalshi-leaderboard/retry";

const TOGGLE = "px-2.5 sm:px-3 py-1 border text-xs sm:text-sm font-medium whitespace-nowrap";
const TOGGLE_ON = "bg-primary text-primary-foreground border-primary";
const TOGGLE_OFF = "bg-background text-foreground border-border hover:bg-gray-200 dark:hover:bg-gray-700";
const NOTE = "text-sm text-muted-foreground py-8 text-center";

function TraderAvatar({ row }: { row: KalshiTrader }) {
  const [failed, setFailed] = useState(false);
  if (row.pfp && !failed) {
    return (
      <img
        src={smallAvatar(row.pfp)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase">
      {row.name.slice(0, 1)}
    </div>
  );
}

export default function KalshiLeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [nonSports, setNonSports] = useState(false);
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    document.title = KALSHI_GUIDE.title;
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/kalshi-leaderboard", period, nonSports],
    queryFn: () => fetchKalshiLeaderboard(period, nonSports),
    staleTime: 300_000,
    retry: retryNetworkOnly,
    retryDelay,
  });

  const rows = useMemo(() => filterTraders(data?.traders ?? [], deferredSearch), [data, deferredSearch]);

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-5 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl sm:text-2xl font-normal">Kalshi Leaderboard</h1>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs sm:text-sm px-2 sm:px-3 py-1 border border-border hover:bg-primary hover:text-primary-foreground">
                All platforms
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            The top {data?.tracked ? data.tracked.toLocaleString("en-US") : "1,000"} Kalshi traders, tracked over time
          </p>
          {data?.lastUpdated && <p className="text-xs text-muted-foreground">P&amp;L updated {formatUpdated(data.lastUpdated)}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">P&amp;L:</span>
            <div className="flex gap-1">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setPeriod(key);
                    setVisible(PAGE_SIZE);
                  }}
                  className={`${TOGGLE} ${period === key ? TOGGLE_ON : TOGGLE_OFF}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setNonSports((on) => !on);
                setVisible(PAGE_SIZE);
              }}
              title="Only traders who make most of their profit outside sports"
              className={`${TOGGLE} ${nonSports ? TOGGLE_ON : TOGGLE_OFF}`}
            >
              Non-sports
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search Kalshi traders..."
              maxLength={50}
              autoComplete="off"
              spellCheck={false}
              className="px-3 py-1 border border-border bg-background text-foreground text-sm w-full sm:w-56 focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm whitespace-nowrap">{rows.length.toLocaleString("en-US")} traders</span>
          </div>
        </div>

        {isError && <p className={NOTE}>Could not load the Kalshi leaderboard.</p>}
        {isLoading && <p className={NOTE}>Loading Kalshi traders…</p>}
        {!isLoading && !isError && rows.length === 0 && (
          <p className={NOTE}>{search ? "No traders match that search." : "Kalshi traders are still being collected. Check back shortly."}</p>
        )}

        {rows.length > 0 && (
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-1 sm:p-3 font-normal w-10 sm:w-16 text-sm sm:text-lg">#</th>
                <th className="p-0.5 sm:p-2 font-normal w-9 sm:w-14"></th>
                <th className="text-left p-1 sm:p-3 font-normal text-sm sm:text-lg">Trader</th>
                <th className="text-right p-1 sm:p-3 font-normal text-sm sm:text-lg">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, visible).map((row) => (
                <tr key={row.kalshi_username} className="border-b border-border hover:bg-muted/50">
                  <td className="p-1 sm:p-3 text-sm sm:text-base text-muted-foreground">{row.rank}</td>
                  <td className="p-0.5 sm:p-2">
                    <TraderAvatar row={row} />
                  </td>
                  <td className="p-1 sm:p-3 text-sm sm:text-base truncate">
                    {row.profile_path ? (
                      <Link href={row.profile_path} className="hover:underline">
                        {row.name}
                      </Link>
                    ) : (
                      <a href={row.kalshi_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {row.name}
                      </a>
                    )}
                    {row.profile_path && row.name !== row.kalshi_username && (
                      <span className="text-muted-foreground text-xs ml-2">@{row.kalshi_username}</span>
                    )}
                  </td>
                  <td className={`p-1 sm:p-3 text-right text-sm sm:text-base tabular-nums ${row.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPnl(row.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rows.length > visible && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisible((n) => n + PAGE_SIZE)}
              className="text-sm px-4 py-2 border border-border hover:bg-primary hover:text-primary-foreground"
            >
              Show more ({(rows.length - visible).toLocaleString("en-US")} left)
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-8">
          Rankings come from Kalshi's public profiles. Daily, weekly and monthly P&amp;L are measured from our own snapshots, so they fill in over
          the first days a trader is tracked.
        </p>
        <LeaderboardGuide guide={KALSHI_GUIDE} />
      </div>
      <ReplicaNotice />
    </div>
  );
}
