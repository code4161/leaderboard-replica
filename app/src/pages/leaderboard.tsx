import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReplicaNotice } from "@/components/replica-notice";
import { SiteFooter } from "@/components/site-footer";
import { formatUpdated } from "@/lib/format";
import { getJson } from "@/lib/query";
import { Controls } from "./leaderboard/controls";
import { nextDirection, selectTraders } from "./leaderboard/filter-sort";
import { LeaderboardGuide, polymarketGuide } from "./leaderboard/guide";
import { LeaderboardSkeleton, LeaderboardTable } from "./leaderboard/table";
import {
  apiPeriod,
  dailyProfitResponse,
  leaderboardResponse,
  type ExtraColumn,
  type LeaderboardData,
  type Period,
  type PlatformFilter,
  type SortColumn,
  type SortDirection,
} from "./leaderboard/types";

const TITLE = "Prediction Market Leaderboard — Top Polymarket & Kalshi Traders | predicting.top";
const HEADING = "Prediction Market Leaderboard";
const SUBTITLE = "Top Polymarket, Kalshi & Hyperliquid traders, ranked by P&L in real time";
const PREFETCHED: Period[] = ["1d", "1m", "ytd", "all"];
const MINUTE = 60_000;

async function fetchLeaderboard(period: Period): Promise<LeaderboardData> {
  const res = await fetch(`/api/leaderboard?period=${apiPeriod(period)}`);
  if (!res.ok) throw new Error(res.status === 429 ? "Rate limited - please wait a moment" : "Failed to fetch leaderboard");
  return leaderboardResponse.parse(await res.json());
}

const leaderboardKey = (period: Period) => ["/api/leaderboard", period] as const;

function pageSize(): number {
  return window.innerWidth < 768 ? 15 : 30;
}

export default function Leaderboard({ platform: route }: { platform: "all" | "polymarket" }) {
  const guide = route === "polymarket" ? polymarketGuide : null;
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("1d");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [platform, setPlatform] = useState<PlatformFilter>(route);
  const [affiliatedOnly, setAffiliatedOnly] = useState(false);
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [hideSports, setHideSports] = useState(true);
  const [hideEsports, setHideEsports] = useState(true);
  const [bigMoversOnly, setBigMoversOnly] = useState(true);
  const [visible, setVisible] = useState(pageSize);
  const [columns, setColumns] = useState<ReadonlySet<ExtraColumn>>(new Set());


  const prefetch = (target: Period) => {
    if (target === period) return;
    void queryClient.prefetchQuery({ queryKey: leaderboardKey(target), queryFn: () => fetchLeaderboard(target), staleTime: MINUTE });
  };

  const { data: daily } = useQuery({
    queryKey: ["/api/daily-profit"],
    queryFn: async () => dailyProfitResponse.parse(await getJson<unknown>("/api/daily-profit")),
    staleTime: MINUTE,
  });

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: leaderboardKey(period),
    queryFn: () => fetchLeaderboard(period),
    staleTime: MINUTE,
    gcTime: 5 * MINUTE,
    refetchInterval: MINUTE,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    placeholderData: (previous) => previous,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  useEffect(() => {
    document.title = guide?.title ?? TITLE;
  }, [guide]);

  // Once the first table is in, fetch the other periods while the browser is idle so switching is instant.
  const loaded = !!data;
  const prefetched = useRef(false);
  const prefetchRef = useRef(prefetch);
  useEffect(() => {
    prefetchRef.current = prefetch;
  });
  useEffect(() => {
    if (!loaded || prefetched.current) return;
    const run = () => {
      prefetched.current = true;
      PREFETCHED.forEach((p) => prefetchRef.current(p));
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 2000);
    return () => clearTimeout(id);
  }, [loaded]);

  // A link to /#some-id scrolls there once the page has content.
  useEffect(() => {
    if (isLoading) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 300);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const traders = data?.traders;
  const selected = useMemo(
    () =>
      traders
        ? selectTraders(traders, { platform, affiliatedOnly, linkedOnly, hideSports, hideEsports, search, period, bigMoversOnly }, sortColumn, sortDirection)
        : [],
    [traders, platform, affiliatedOnly, linkedOnly, hideSports, hideEsports, search, period, bigMoversOnly, sortColumn, sortDirection],
  );
  const rows = useDeferredValue(selected);

  const resetVisible = () => setVisible(pageSize());

  if (isLoading) return <LeaderboardSkeleton heading={guide?.heading ?? HEADING} subtitle={guide?.subtitle ?? SUBTITLE} />;

  const updated = formatUpdated(data?.lastUpdated);

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-5 overflow-x-hidden" data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl sm:text-2xl font-normal text-foreground" data-testid="page-title">{guide?.heading ?? HEADING}</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-muted-foreground text-sm">{guide?.subtitle ?? SUBTITLE}</p>
              {updated && <p className="text-xs text-muted-foreground" data-testid="last-updated">P&L updated {updated}</p>}
            </div>
            {daily && (
              <p className="text-lg font-semibold">
                Today: <span className={daily.daily_profit.startsWith("+") ? "text-green-500" : "text-red-500"}>{daily.daily_profit}</span>
              </p>
            )}
          </div>
        </div>

        {isError && data && (
          <div className="mb-4 p-3 border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm">
            Having trouble refreshing data. Showing cached results. {error?.message}
          </div>
        )}

        <Controls
          search={search}
          onSearch={setSearch}
          shown={selected.length}
          total={traders?.length || 0}
          period={period}
          onPeriod={(next) => {
            if (next !== period) resetVisible();
            setPeriod(next);
          }}
          onPeriodIntent={prefetch}
          bigMoversOnly={bigMoversOnly}
          onBigMovers={() => {
            resetVisible();
            setBigMoversOnly((v) => !v);
          }}
          platform={platform}
          onPlatform={(next) => {
            resetVisible();
            setPlatform(next);
          }}
          affiliatedOnly={affiliatedOnly}
          onAffiliated={() => {
            resetVisible();
            setAffiliatedOnly((v) => !v);
          }}
          linkedOnly={linkedOnly}
          onLinked={() => {
            resetVisible();
            setLinkedOnly((v) => !v);
          }}
          hideSports={hideSports}
          onSports={() => {
            resetVisible();
            setHideSports((v) => !v);
          }}
          hideEsports={hideEsports}
          onEsports={() => {
            resetVisible();
            setHideEsports((v) => !v);
          }}
          columns={columns}
          onColumn={(column) =>
            setColumns((current) => {
              const next = new Set(current);
              if (!next.delete(column)) next.add(column);
              return next;
            })
          }
        />

        <p className="mb-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/70">Score</span> = consistency 25% * returns 25% * win rate 20% * max loss 15% * profit factor 15% <span className="mx-2">|</span> <span className="font-medium text-foreground/70">Sharpe</span> = return / volatility
        </p>

        <div className="overflow-hidden">
          <LeaderboardTable
            traders={rows.slice(0, visible)}
            period={period}
            columns={columns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={(column) => {
              resetVisible();
              setSortDirection(nextDirection(sortColumn, sortDirection, column));
              setSortColumn(column);
            }}
            refreshing={isFetching}
          />
          {rows.length > visible && (
            <button
              onClick={() => setVisible((v) => Math.min(v + pageSize(), rows.length))}
              className="w-full py-2 mt-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-accent/50"
            >
              Show More ({visible} of {rows.length})
            </button>
          )}
        </div>

        {guide && <LeaderboardGuide guide={guide} />}
        <SiteFooter />
      </div>
      <ReplicaNotice />
    </div>
  );
}
