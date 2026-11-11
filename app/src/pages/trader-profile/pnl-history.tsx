import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { historyUrlFor, usePnlHistory } from "./data";
import { chartPnl } from "./format";
import { buildChart, KALSHI_COLOUR, POLYMARKET_COLOUR, tickLabel, type HistoryPoint } from "./series";

function HistoryTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload: HistoryPoint }[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2">
      <p className="text-xs text-neutral-400 mb-1">{new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <p className={`text-sm font-semibold ${p.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
        {p.polymarket !== undefined && <span className="text-neutral-400 font-normal">Combined </span>}
        {chartPnl(p.pnl)}
      </p>
      {p.polymarket !== undefined && (
        <>
          <p className="text-xs" style={{ color: POLYMARKET_COLOUR }}>Polymarket {chartPnl(p.polymarket)}</p>
          <p className="text-xs" style={{ color: KALSHI_COLOUR }}>Kalshi {chartPnl(p.kalshi ?? 0)}</p>
        </>
      )}
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">P&amp;L History</h3>
      <div className="h-48 flex items-center justify-center">{children}</div>
    </div>
  );
}

const Swatch = ({ colour, label }: { colour: string; label: string }) => (
  <span className="flex items-center gap-1">
    <span className="inline-block w-3 h-0.5" style={{ background: colour }} />
    {label}
  </span>
);

export function PnlHistory({ kalshiUsername, historyUrl, description }: { kalshiUsername?: string; historyUrl?: string; description?: string }) {
  const { data, isLoading, error } = usePnlHistory(historyUrlFor({ kalshiUsername, historyUrl }));
  if (isLoading) return <Placeholder><div className="animate-pulse text-muted-foreground">Loading chart...</div></Placeholder>;
  if (error || !data?.history || data.history.length === 0) return <Placeholder><p className="text-muted-foreground text-sm">No historical data available yet</p></Placeholder>;

  const chart = buildChart(data.history);
  const tick = { fill: "#8b8b8b", fontSize: 11 };
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">P&amp;L History</h3>
        <div className="relative group">
          <svg className="w-4 h-4 text-muted-foreground/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-48">
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-300 shadow-lg">
              {description ?? (historyUrl ? "Cumulative Polymarket P&L from Polymarket, all of this trader's wallets combined." : "We started tracking Kalshi P&L recently, so historical data may be limited.")}
            </div>
          </div>
        </div>
      </div>
      {chart.split && (
        <div className="-mt-2 mb-2 flex items-center gap-3 text-xs text-muted-foreground">
          <Swatch colour={chart.lineColour} label="Combined" />
          <Swatch colour={POLYMARKET_COLOUR} label="Polymarket" />
          <Swatch colour={KALSHI_COLOUR} label="Kalshi" />
        </div>
      )}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.points} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin", "dataMax"]} ticks={chart.ticks} axisLine={false} tickLine={false} tick={tick} tickFormatter={(v: number) => tickLabel(v, chart.longRange)} />
            <YAxis domain={chart.domain} axisLine={false} tickLine={false} tick={tick} tickFormatter={(v: number) => chartPnl(v)} width={55} />
            <ReferenceLine y={0} stroke="#404040" strokeWidth={1} strokeDasharray="3 3" />
            <Tooltip content={<HistoryTooltip />} />
            <Line type="monotone" dataKey="pnl" stroke={chart.lineColour} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: chart.lineColour }} />
            {chart.split && <Line type="monotone" dataKey="polymarket" stroke={POLYMARKET_COLOUR} strokeWidth={1.5} dot={false} activeDot={false} />}
            {chart.split && <Line type="monotone" dataKey="kalshi" stroke={KALSHI_COLOUR} strokeWidth={1.5} dot={false} activeDot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
