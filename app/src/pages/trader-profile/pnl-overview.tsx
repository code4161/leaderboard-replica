import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { overviewPnl } from "./format";
import { overviewBars, type OverviewBar, type Period } from "./series";

function OverviewTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload: OverviewBar }[] }) {
  if (!active || !payload || !payload.length) return null;
  const b = payload[0].payload;
  return (
    <div className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2">
      <p className="text-xs text-neutral-400 mb-1">{b.fullLabel}</p>
      <p className={`text-sm font-semibold ${b.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{overviewPnl(b.pnl)}</p>
      <p className="text-xs text-neutral-400 mt-1">{b.trades} trades</p>
    </div>
  );
}

/** Shown in place of the history chart for a trader with no wallet to pull a history for. */
export function PnlOverview({ stats }: { stats: Record<"1d" | "7d" | "30d" | "all", Period> }) {
  const { bars, domain } = overviewBars(stats);
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">P&amp;L Overview</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 12 }} />
            <YAxis domain={domain} axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 11 }} tickFormatter={(v: number) => overviewPnl(v)} width={60} />
            <ReferenceLine y={0} stroke="#404040" strokeWidth={1} />
            <Tooltip content={<OverviewTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="pnl" radius={[4, 4, 4, 4]} maxBarSize={45}>
              {bars.map((b, i) => <Cell key={`cell-${i}`} fill={b.pnl >= 0 ? "#22c55e" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
