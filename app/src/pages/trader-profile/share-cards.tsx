import { useMemo, useState, type ReactNode } from "react";
import { recentMonths } from "./calendar";
import { sharePlatform, upDown } from "./format";

const SITE = "https://predicting.top";
const SECONDARY = "px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80";
const pill = (on: boolean) => `px-2.5 py-1 text-xs rounded ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`;
const fileStem = (name: string) => name.replace(/[^\w.-]+/g, "_");
const isAmount = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const pngBlob = (url: string) => fetch(url).then((r) => r.blob());

export const postOnXUrl = (text: string, profileUrl: string) => `https://x.com/intent/post?text=${encodeURIComponent(`${text}\n\n${profileUrl}`)}`;

type CardProps = { title: string; control: ReactNode; imageUrl: string; alt: string; fileName: string; shareText: string; profileUrl: string; previewClassName: string };

/** One share card: a rendered image from the OG routes, with share, copy, download and post actions. */
function ShareCard({ title, control, imageUrl, alt, fileName, shareText, profileUrl, previewClassName }: CardProps) {
  const [preparing, setPreparing] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const canCopy = typeof window !== "undefined" && "ClipboardItem" in window && !!navigator.clipboard?.write;

  const download = async () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await pngBlob(imageUrl));
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const share = async () => {
    setPreparing(true);
    try {
      const file = new File([await pngBlob(imageUrl)], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: shareText, url: profileUrl });
      else await download();
    } catch {
      /* the share sheet was dismissed, or the image could not be fetched */
    } finally {
      setPreparing(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob(imageUrl) })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await download();
    }
  };
  // Posting on X cannot attach an image, so it is put on the clipboard and the user is told to paste it.
  const copyForPost = () => {
    if (!canCopy) return;
    navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob(imageUrl) })]).then(
      () => { setPasteHint(true); setTimeout(() => setPasteHint(false), 15000); },
      () => setPasteHint(false),
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm text-muted-foreground">{title}</h2>
        {control}
      </div>
      <div className={`relative mx-auto w-full rounded-lg overflow-hidden bg-muted ${previewClassName}`}>
        {loaded !== imageUrl && <div className="absolute inset-0 animate-pulse bg-muted" />}
        <img key={imageUrl} src={imageUrl} alt={alt} className="w-full h-full object-contain" loading="lazy" onLoad={() => setLoaded(imageUrl)} />
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        <button onClick={share} disabled={preparing} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-60">
          {preparing ? "Preparing…" : "Share"}
        </button>
        {canCopy && <button onClick={copy} className={SECONDARY}>{copied ? "Copied!" : "Copy image"}</button>}
        <button onClick={download} className={SECONDARY}>Download</button>
        <a href={postOnXUrl(shareText, profileUrl)} target="_blank" rel="noopener noreferrer" onClick={copyForPost} className={SECONDARY}>Post on X</a>
      </div>
      {pasteHint && <p className="text-center text-xs text-muted-foreground mt-2" role="status">Image copied. Paste it into your post (Ctrl/Cmd+V) before posting.</p>}
    </div>
  );
}

type Who = { traderId: string; traderName: string; platform: string | null | undefined };

export function comboShareText(name: string, monthName: string, platform: Who["platform"], allTime: unknown): string {
  return `${name}'s ${monthName} on ${sharePlatform(platform)}${isAmount(allTime) ? `, ${upDown(allTime)} all-time` : ""}`;
}

export function ShareCombo({ traderId, traderName, platform, allTimePnl }: Who & { allTimePnl: number | undefined }) {
  const months = useMemo(() => recentMonths(new Date()), []);
  const [month, setMonth] = useState(months[0].value);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const picked = months.find((m) => m.value === month);
  const label = picked?.short ?? month;
  return (
    <ShareCard
      title="Share month + all-time"
      control={
        <div className="flex flex-wrap justify-end gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs" aria-label="Month">
            {months.map((m) => <option key={m.value} value={m.value}>{m.short}</option>)}
          </select>
          <div className="flex gap-1" role="group" aria-label="Colour">
            <button onClick={() => setTheme("light")} aria-pressed={theme === "light"} className={pill(theme === "light")}>Light</button>
            <button onClick={() => setTheme("dark")} aria-pressed={theme === "dark"} className={pill(theme === "dark")}>Black</button>
          </div>
        </div>
      }
      imageUrl={`/api/og/combo/${encodeURIComponent(traderId)}?month=${month}${theme === "dark" ? "&theme=dark" : ""}`}
      alt={`${traderName} ${label} P&L calendar and all-time P&L chart`}
      fileName={`${fileStem(traderName)}-${month}-pnl${theme === "dark" ? "-black" : ""}.png`}
      shareText={comboShareText(traderName, picked?.name ?? label, platform, allTimePnl)}
      profileUrl={`${SITE}/account/${encodeURIComponent(traderId)}`}
      previewClassName="max-w-[800px] aspect-video"
    />
  );
}

const RANGES = [
  { value: "all", label: "All time", text: "all-time" },
  { value: "30d", label: "30D", text: "30-day" },
  { value: "7d", label: "7D", text: "7-day" },
] as const;
type Range = (typeof RANGES)[number]["value"];

export function chartShareText(name: string, range: Range, platform: Who["platform"], amount: unknown): string {
  const on = sharePlatform(platform);
  if (!isAmount(amount)) return `${name}'s ${RANGES.find((r) => r.value === range)?.text} P&L on ${on}`;
  return range === "all" ? `${name} is ${upDown(amount)} all-time on ${on}` : `${name} is ${upDown(amount)} over the last ${range === "30d" ? "30" : "7"} days on ${on}`;
}

export function ShareChart({ traderId, traderName, platform, pnl }: Who & { pnl: Record<Range, number | undefined> }) {
  const [range, setRange] = useState<Range>("all");
  return (
    <ShareCard
      title="Share P&L chart"
      control={
        <div className="flex gap-1" role="group" aria-label="Range">
          {RANGES.map((r) => <button key={r.value} onClick={() => setRange(r.value)} aria-pressed={range === r.value} className={pill(range === r.value)}>{r.label}</button>)}
        </div>
      }
      imageUrl={`/api/og/pnl/${encodeURIComponent(traderId)}?range=${range}`}
      alt={`${traderName} ${RANGES.find((r) => r.value === range)?.text} P&L chart`}
      fileName={`${fileStem(traderName)}-pnl-${range}.png`}
      shareText={chartShareText(traderName, range, platform, pnl[range])}
      profileUrl={`${SITE}/account/${encodeURIComponent(traderId)}`}
      previewClassName="max-w-[720px] aspect-[40/21]"
    />
  );
}

export function ShareMonth({ traderId, traderName, platform }: Who) {
  const months = useMemo(() => recentMonths(new Date()), []);
  const [month, setMonth] = useState(months[0].value);
  const label = months.find((m) => m.value === month)?.long ?? month;
  return (
    <ShareCard
      title="Share month"
      control={
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm" aria-label="Month">
          {months.map((m) => <option key={m.value} value={m.value}>{m.long}</option>)}
        </select>
      }
      imageUrl={`/api/og/calendar/${encodeURIComponent(traderId)}?month=${month}`}
      alt={`${traderName} ${label} P&L calendar`}
      fileName={`${fileStem(traderName)}-${month}.png`}
      shareText={`${traderName}'s ${label} P&L on ${sharePlatform(platform)}`}
      profileUrl={`${SITE}/account/${encodeURIComponent(traderId)}`}
      previewClassName="max-w-[360px] aspect-[4/5]"
    />
  );
}
