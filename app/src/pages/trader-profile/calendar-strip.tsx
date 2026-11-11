import { useState, type MouseEvent } from "react";
import { dailyPnl, dayColour, dayTextColour, monthColour, monthView, yearByMonth } from "./calendar";
import { historyUrlFor, usePnlHistory } from "./data";
import { dayPnl, monthPnl, wholeDollars } from "./format";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const stop = (e: MouseEvent) => e.stopPropagation();

function Chevron({ d, className }: { d: string; className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export function CalendarStrip({ kalshiUsername, historyUrl, platform }: { kalshiUsername?: string; historyUrl?: string; platform: string | null | undefined }) {
  const url = historyUrlFor({ kalshiUsername, historyUrl });
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [mode, setMode] = useState<"daily" | "monthly">("daily");
  const { data, isLoading } = usePnlHistory(url, !!historyUrl || platform === "kalshi" || platform === "both");

  const { days, start } = dailyPnl(data?.history ?? undefined);
  const now = new Date();
  const m = monthView(days, start, now, offset);
  const thisYear = now.getFullYear();
  const year = yearByMonth(days, thisYear);
  const isBest = (day: number) => day === m.bestDay && m.bestPnl > 0;
  const accent = platform === "kalshi" ? "border-t-green-500/50" : platform === "both" ? "border-t-border" : "border-t-sky-400/50";

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-3 mb-6 border-t-2 ${accent}`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="flex-1 flex gap-1">
            {Array.from({ length: 7 }, (_, i) => <div key={i} className="w-6 h-6 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg mb-6 border-t-2 ${accent}`}>
      <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2" onClick={stop}>
          <button
            onClick={() => m.canGoBack && setOffset((o) => o - 1)}
            className={`p-1 rounded transition-colors ${m.canGoBack ? "hover:bg-muted" : "opacity-30 cursor-not-allowed"}`}
            disabled={!m.canGoBack}
            title={m.canGoBack ? "Previous month" : "No earlier data"}
          >
            <Chevron className="w-4 h-4 text-muted-foreground" d="M15 19l-7-7 7-7" />
          </button>
          <span className="text-sm font-medium text-muted-foreground min-w-[80px] text-center">{m.label}</span>
          <button
            onClick={() => setOffset((o) => Math.min(o + 1, 0))}
            className={`p-1 rounded transition-colors ${m.isCurrent ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"}`}
            disabled={m.isCurrent}
            title="Next month"
          >
            <Chevron className="w-4 h-4 text-muted-foreground" d="M9 5l7 7-7 7" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${m.total >= 0 ? "text-green-500" : "text-red-500"}`}>{wholeDollars(m.total)}</span>
          <span className="text-xs text-muted-foreground">{m.winDays}W / {m.lossDays}L</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-0.5">
            {m.stripDays.map((day) => {
              const v = m.pnlOn(day);
              return <div key={day} className={`w-2 h-4 rounded-sm ${dayColour(v, isBest(day))}`} title={v !== null ? `Day ${day}: ${dayPnl(v)}` : `Day ${day}: No data`} />;
            })}
          </div>
          <Chevron className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} d="M19 9l-7 7-7-7" />
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 border-t border-border/50">
          <div className="flex items-center justify-between mt-3 mb-2" onClick={stop}>
            <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
              <button onClick={() => setMode("daily")} className={`px-2.5 py-1 font-medium transition-colors ${mode === "daily" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
                Daily
              </button>
              <button onClick={() => setMode("monthly")} className={`px-2.5 py-1 font-medium transition-colors border-l border-border ${mode === "monthly" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
                Monthly
              </button>
            </div>
          </div>
          {mode === "monthly" && (
            <div className="flex flex-col items-center text-center mb-3" onClick={stop}>
              <span className="text-xs sm:text-sm font-semibold tracking-widest text-muted-foreground uppercase">{thisYear} YTD</span>
              <span className={`text-4xl sm:text-6xl font-extrabold leading-none tracking-tight ${year.ytd >= 0 ? "text-green-500" : "text-red-500"}`}>{monthPnl(year.ytd)}</span>
            </div>
          )}
          {mode === "monthly" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MONTHS.map((name, i) => {
                const mt = year.months[i];
                return (
                  <div
                    key={name}
                    className={`rounded-lg border border-border/50 transition-colors flex flex-col items-center justify-center aspect-[3/2] ${monthColour(mt, i === year.bestMonth)}`}
                    title={mt.hasData ? `${name} ${thisYear}: ${wholeDollars(mt.total)}` : `${name}: No data`}
                  >
                    <div className="text-xs sm:text-sm font-semibold tracking-widest text-muted-foreground mb-1">{name}</div>
                    <div className={`text-base sm:text-xl font-bold ${mt.hasData ? (mt.total >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground/40"}`}>
                      {mt.hasData ? monthPnl(mt.total) : "–"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {m.cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} className="w-full aspect-square" />;
                  if (m.isBeforeStart(day)) {
                    return (
                      <div key={day} className="aspect-square rounded flex items-center justify-center text-[10px]" title="Before tracking started">
                        <span className="text-muted-foreground/20 font-medium">{day}</span>
                      </div>
                    );
                  }
                  const v = m.pnlOn(day);
                  const today = m.isCurrent && day === now.getDate();
                  const future = m.isFuture(day);
                  const started = m.isStart(day);
                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded flex flex-col items-center justify-center text-[10px] transition-all duration-150 cursor-pointer ${future ? "bg-muted/20" : dayColour(v, isBest(day))} ${today ? "ring-1 ring-primary" : ""} ${started ? "ring-1 ring-blue-400/50" : ""} ${future ? "" : "hover:scale-110 hover:brightness-110 hover:shadow-md hover:z-10"}`}
                      title={started ? "Tracking started" : v !== null ? `${wholeDollars(v)}` : "No data"}
                    >
                      <span className={`font-medium ${future ? "text-muted-foreground/40" : "text-foreground/70"}`}>{day}</span>
                      {!future && v !== null && <span className={`text-[10px] font-bold leading-none ${dayTextColour(v, isBest(day))}`}>{dayPnl(v)}</span>}
                      {!future && v === null && !started && <span className="text-[8px] text-muted-foreground/40">—</span>}
                      {started && !future && v === null && <span className="text-[7px] text-blue-400">start</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {[["bg-red-500/30", "Loss"], ["bg-muted/30", "~$0"], ["bg-green-500/30", "Profit"], ["bg-yellow-500/60", "Best"]].map(([colour, label]) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded ${colour}`} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
