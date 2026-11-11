import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { retryDelay, retryNetworkOnly } from "../kalshi-leaderboard/retry";
import {
  buildSeries,
  fetchComparison,
  formatCompactUsd,
  formatTickDate,
  formatTooltipDate,
  tickInterval,
  valueDomain,
  type HistoryPoint,
} from "./comparison";

const POLY_COLOR = "#38bdf8";
const KALSHI_COLOR = "#22c55e";

type Names = { polyName: string; kalshiName: string };
type TooltipEntry = { dataKey?: unknown; value?: unknown; color?: string; payload?: unknown };
type TooltipState = { active?: boolean; payload?: readonly TooltipEntry[] };

function timestampOf(entry: TooltipEntry | undefined): number | undefined {
  const row = entry?.payload;
  if (typeof row !== "object" || row === null || !("timestamp" in row)) return undefined;
  return typeof row.timestamp === "number" ? row.timestamp : undefined;
}

function ChartTooltip({ active, payload, polyName, kalshiName }: TooltipState & Names) {
  if (!active || !payload || !payload.length) return null;
  const timestamp = timestampOf(payload[0]);
  const date = timestamp ? new Date(timestamp) : new Date();
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{formatTooltipDate(date)}</p>
      {payload.map((entry, i) => {
        const value = Number(entry.value);
        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.dataKey === "poly" ? polyName : kalshiName}:</span>
            <span className={`font-medium ${value >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCompactUsd(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Performance Comparison</h3>
      <div className="h-64 flex items-center justify-center">{children}</div>
    </div>
  );
}

function Chart({ poly, kalshi, polyName, kalshiName }: { poly: readonly HistoryPoint[]; kalshi: readonly HistoryPoint[] } & Names) {
  const series = useMemo(() => buildSeries(poly, kalshi), [poly, kalshi]);
  const domain = useMemo(() => valueDomain(series), [series]);
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Relative Performance</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: POLY_COLOR }} />
            <span className="text-muted-foreground">{polyName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: KALSHI_COLOR }} />
            <span className="text-muted-foreground">{kalshiName}</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8b8b8b", fontSize: 11 }}
              tickFormatter={formatTickDate}
              interval={tickInterval(series.length)}
            />
            <YAxis domain={domain} axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 11 }} tickFormatter={formatCompactUsd} width={60} />
            <ReferenceLine y={0} stroke="#404040" strokeWidth={1} strokeDasharray="3 3" />
            <Tooltip content={(state) => <ChartTooltip active={state.active} payload={state.payload} polyName={polyName} kalshiName={kalshiName} />} />
            <Line type="monotone" dataKey="poly" stroke={POLY_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: POLY_COLOR }} connectNulls />
            <Line type="monotone" dataKey="kalshi" stroke={KALSHI_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: KALSHI_COLOR }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">P/L change since comparison start date</p>
    </div>
  );
}

type Props = { polyWallet: string; kalshiUsername: string } & Names;

export function ComparisonChart({ polyWallet, kalshiUsername, polyName, kalshiName }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/battle/comparison", polyWallet, kalshiUsername],
    queryFn: () => fetchComparison(polyWallet, kalshiUsername),
    enabled: !!polyWallet && !!kalshiUsername,
    staleTime: 300_000,
    retry: retryNetworkOnly,
    retryDelay,
  });

  if (isLoading)
    return (
      <Panel>
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </Panel>
    );
  if (error || !data)
    return (
      <Panel>
        <p className="text-muted-foreground text-sm">Unable to load comparison data</p>
      </Panel>
    );
  const poly = data.polymarket.history;
  const kalshi = data.kalshi.history;
  if (poly.length === 0 && kalshi.length === 0)
    return (
      <Panel>
        <p className="text-muted-foreground text-sm">No historical data available yet</p>
      </Panel>
    );
  return <Chart poly={poly} kalshi={kalshi} polyName={polyName} kalshiName={kalshiName} />;
}
