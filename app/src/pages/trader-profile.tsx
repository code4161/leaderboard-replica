import { useEffect, type SyntheticEvent } from "react";
import { ReplicaNotice } from "@/components/replica-notice";
import { ThemeToggle } from "@/components/theme-toggle";
import { largeAvatar } from "@/lib/avatar";
import { hyperliquidLogo, kalshiLogo, polymarketLogo } from "@/lib/logos";
import { CalendarStrip } from "./trader-profile/calendar-strip";
import { CategoryCard } from "./trader-profile/category-card";
import { useTrader, type Trader } from "./trader-profile/data";
import { isWalletAddress, joinDate, platformLabel, shortWallet, titlePnl } from "./trader-profile/format";
import { polymarketProfile, twitterHandle, twitterUrl, withKalshiReferral, withVia } from "./trader-profile/links";
import { PnlHistory } from "./trader-profile/pnl-history";
import { PnlOverview } from "./trader-profile/pnl-overview";
import { ShareChart, ShareCombo, ShareMonth } from "./trader-profile/share-cards";

const BACK_ARROW = "M15 19l-7-7 7-7";
const X_MARK = "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z";
const ZERO = { pnl: 0, buys: 0, sells: 0 };

export function profileTitle(trader: Trader | null | undefined): string {
  if (!trader) return "Trader Profile | predicting.top";
  const pnl = titlePnl(trader.stats?.all?.pnl || 0);
  const who = isWalletAddress(trader.name) || !trader.name.trim() ? shortWallet(trader.wallet || trader.name) : trader.name;
  return `${who} · ${pnl} all-time | predicting.top`;
}

function useDocumentTitle(title: string) {
  useEffect(() => {
    const before = document.title;
    document.title = title;
    return () => { document.title = before; };
  }, [title]);
}

function avatarFallback(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = "/toplogo.jpg";
}

function BackArrow() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BACK_ARROW} />
    </svg>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs mb-1">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

const TIER_COLOUR: Record<string, string> = {
  Elite: "bg-green-500/10 text-green-600 dark:text-green-400",
  Great: "bg-green-500/10 text-green-600 dark:text-green-500",
  Good: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  Average: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

function Avatar({ trader, polymarketUrl, kalshiUrl }: { trader: Trader; polymarketUrl: string; kalshiUrl: string }) {
  if (!trader.pfp) return null;
  const img = <img src={largeAvatar(trader.pfp)} alt={`${trader.name} profile`} className="w-full h-full object-cover" loading="eager" onError={avatarFallback} />;
  const kalshi = trader.platform === "kalshi";
  if ((kalshi || trader.platform === "both") && trader.kalshi_profile) {
    return (
      <a href={kalshiUrl} target="_blank" rel="noopener noreferrer" className="group">
        <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-colors ${kalshi ? "border-green-500/50 group-hover:border-green-500" : "border-sky-400/50 group-hover:border-sky-400"}`}>{img}</div>
      </a>
    );
  }
  if (trader.polymarket_profile) {
    return (
      <a href={polymarketUrl} target="_blank" rel="noopener noreferrer" className="group">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-sky-400/50 group-hover:border-sky-400 transition-colors">{img}</div>
      </a>
    );
  }
  return <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${kalshi ? "border-green-500/50" : "border-sky-400/50"}`}>{img}</div>;
}

function WalletLine({ wallet, also }: { wallet: string; also?: boolean }) {
  return (
    <p>
      {also && <span className="text-muted-foreground/80">Also: </span>}
      <a href={`/account/${wallet}`} className="hover:text-foreground underline-offset-2 hover:underline" title={wallet}>{shortWallet(wallet)}</a>
      <span className="sr-only"> {wallet}</span>
    </p>
  );
}

function Profile({ trader, id }: { trader: Trader; id: string }) {
  const { platform, wallet } = trader;
  const kalshiUsername = trader.kalshi_username || undefined;
  const historyUrl = `/api/trader/${encodeURIComponent(id)}/history`;
  const shareId = platform === "kalshi" && kalshiUsername ? kalshiUsername : wallet || kalshiUsername || id;
  const fallbackPolymarket = withVia("https://polymarket.com");
  const polymarketUrl = platform === "hyperliquid"
    ? trader.polymarket_profile || fallbackPolymarket
    : trader.polymarket_profile ? polymarketProfile(wallet, trader.polymarket_profile) ?? fallbackPolymarket : fallbackPolymarket;
  const kalshiUrl = withKalshiReferral(trader.kalshi_profile || "https://kalshi.com");
  const otherWallets = (trader.additional_wallets || []).filter((w): w is string => !!w && w.toLowerCase() !== wallet?.toLowerCase());
  const accent = platform === "kalshi" ? "border-t-green-500/50" : platform === "both" ? "border-t-border" : "border-t-sky-400/50";
  const badge = platform === "kalshi" ? "bg-green-500/10 text-green-400" : platform === "both" ? "bg-gradient-to-r from-sky-400/10 to-green-500/10 text-foreground" : "bg-sky-400/10 text-sky-400";
  const stats = { "1d": trader.stats?.["1d"] ?? ZERO, "7d": trader.stats?.["7d"] ?? ZERO, "30d": trader.stats?.["30d"] ?? ZERO, all: trader.stats?.all ?? ZERO };
  const views = trader.views ?? 0;
  const score = trader.smart_score;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition text-sm font-medium">
              <BackArrow />
              Leaderboard
            </a>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-4 mb-8">
          <Avatar trader={trader} polymarketUrl={polymarketUrl} kalshiUrl={kalshiUrl} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{trader.name}</h1>
              {(platform === "polymarket" || platform === "both" || (platform === "hyperliquid" && trader.polymarket_profile)) && (
                <a href={polymarketUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" title="View on Polymarket">
                  <img src={polymarketLogo} alt="Polymarket" className="w-5 h-5" />
                </a>
              )}
              {(platform === "kalshi" || platform === "both") && (
                <a href={kalshiUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" title="View on Kalshi">
                  <img src={kalshiLogo} alt="Kalshi" className="w-5 h-5" />
                </a>
              )}
              {trader.hyperliquid_profile && (
                <a href={trader.hyperliquid_profile} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" title="View on Outcome (Hyperliquid HIP-4)">
                  <img src={hyperliquidLogo} alt="Hyperliquid" className="w-5 h-5 rounded-full" />
                </a>
              )}
              {trader.twitter && (
                <a href={twitterUrl(trader.twitter)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title={`@${twitterHandle(trader.twitter)}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d={X_MARK} />
                  </svg>
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${badge}`}>{platformLabel(platform)}</span>
              <span className="text-muted-foreground text-sm">
                {trader.join_date && `Joined ${joinDate(trader.join_date)}`}
                {views > 0 && ` · ${views.toLocaleString()} views`}
              </span>
            </div>
            {(wallet || otherWallets.length > 0 || (trader.additional_wallets?.length ?? 0) > 0) && (
              <div className="text-xs font-mono text-muted-foreground space-y-1">
                {wallet && <WalletLine wallet={wallet} />}
                {otherWallets.map((w) => <WalletLine key={w} wallet={w} also />)}
              </div>
            )}
          </div>
        </div>

        {platform === "kalshi" && kalshiUsername ? <CalendarStrip kalshiUsername={kalshiUsername} platform={platform} /> : wallet ? <CalendarStrip historyUrl={historyUrl} platform={platform} /> : null}

        <div className="mb-6 space-y-4">
          {platform !== "kalshi" && (wallet ? (
            <PnlHistory
              historyUrl={historyUrl}
              description={
                platform === "both" && kalshiUsername ? "Combined Polymarket and Kalshi P&L: all of this trader's Polymarket wallets plus their Kalshi account."
                : platform === "hyperliquid" ? "Realized P&L on Hyperliquid HIP-4 (outcome) markets, from the trader's fills. Open positions are not included."
                : undefined
              }
            />
          ) : <PnlOverview stats={stats} />)}
          {platform === "kalshi" && kalshiUsername && <PnlHistory kalshiUsername={kalshiUsername} />}
          {kalshiUsername && <CategoryCard kalshiUsername={kalshiUsername} />}
          <ShareCombo traderId={shareId} traderName={trader.name} platform={platform} allTimePnl={trader.stats?.all?.pnl} />
          <ShareChart traderId={shareId} traderName={trader.name} platform={platform} pnl={{ all: trader.stats?.all?.pnl, "30d": trader.stats?.["30d"]?.pnl, "7d": trader.stats?.["7d"]?.pnl }} />
          <ShareMonth traderId={shareId} traderName={trader.name} platform={platform} />
        </div>

        {score && (
          <div className={`bg-card border border-border rounded-lg p-4 mb-8 border-t-2 ${accent}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Smart Score</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{score.score}</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${TIER_COLOUR[score.tier] ?? "bg-red-500/10 text-red-600 dark:text-red-400"}`}>{score.tier}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <Stat label="Win Rate">{(score.winRate * 100).toFixed(0)}%</Stat>
              <Stat label="Sharpe">{score.sharpeRatio.toFixed(2)}</Stat>
              <Stat label="Max Drawdown">{(score.maxDrawdownPercent * 100).toFixed(1)}%</Stat>
              <Stat label="Profit Factor">{score.profitFactor.toFixed(2)}</Stat>
              <Stat label="R²">{(score.rSquared * 100).toFixed(0)}%</Stat>
            </div>
          </div>
        )}

        <div className="text-center">
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition text-sm">
            <BackArrow />
            View the Prediction Market Leaderboard
          </a>
        </div>
      </main>
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Track top prediction market traders on Polymarket and Kalshi</p>
          <p className="mt-1">© {new Date().getFullYear()} Predicting.top</p>
        </div>
      </footer>
      <ReplicaNotice />
    </div>
  );
}

export default function TraderProfile({ id }: { id: string }) {
  const { data: trader, isLoading, error } = useTrader(id);
  const missing = !isLoading && (!!error || !trader);
  useDocumentTitle(missing ? "Trader Not Found | predicting.top" : profileTitle(trader));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4" />
            <div className="h-4 bg-muted rounded w-96 mb-8" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
        <ReplicaNotice />
      </div>
    );
  }
  if (error || !trader) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Trader Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find a trader with that wallet address or username.</p>
          <a href="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">View Leaderboard</a>
        </div>
        <ReplicaNotice />
      </div>
    );
  }
  return <Profile trader={trader} id={id} />;
}
