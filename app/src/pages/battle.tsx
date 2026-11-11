import { useEffect } from "react";
import { ReplicaNotice } from "@/components/replica-notice";
import { cn } from "@/lib/utils";
import { ComparisonChart } from "./battle/comparison-chart";
import { kalshiProfileUrl, polymarketProfileUrl } from "./battle/links";
import { largeAvatar } from "./kalshi-leaderboard/avatar";

const TITLE = "Battle of the Badges | predicting.top";

// The two contestants are fixed by the original; the page has no picker.
const POLY = {
  name: "25usdc",
  displayName: "@25usdc",
  twitter: "https://x.com/25usdc",
  pfp: "https://pbs.twimg.com/profile_images/1974217220893892608/_Fie8EaH_400x400.jpg",
  platform: "Polymarket",
  wallet: "0x75e765216a57942d738d880ffcda854d9f869080",
  profileUrl: polymarketProfileUrl("https://polymarket.com/profile/0x75e765216a57942d738d880ffcda854d9f869080"),
};
const KALSHI = {
  name: "PredMTrader",
  displayName: "@PredMTrader",
  twitter: "https://x.com/PredMTrader",
  pfp: "https://pbs.twimg.com/profile_images/1958361929292120064/2sqK385c_400x400.jpg",
  platform: "Kalshi",
  kalshiUsername: "PredMTrader",
  profileUrl: kalshiProfileUrl("https://kalshi.com/ideas/profiles/PredMTrader"),
};
const HOST_AVATAR =
  "https://ugc.production.linktr.ee/dded0857-5699-4616-9a6e-453874744835_Screenshot-2025-10-22-at-5.42.56PM.png?io=true&size=avatar-v3_0";

const SIDES = {
  poly: { ring: "border-sky-400/50 group-hover:border-sky-400", name: "hover:text-sky-400", platform: "text-sky-400" },
  kalshi: { ring: "border-green-500/50 group-hover:border-green-500", name: "hover:text-green-400", platform: "text-green-400" },
};

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Contestant = { name: string; displayName: string; twitter: string; pfp: string; platform: string; profileUrl: string };

function ContestantCard({ who, side }: { who: Contestant; side: keyof typeof SIDES }) {
  const tone = SIDES[side];
  return (
    <div className="flex flex-col items-center">
      <a href={who.profileUrl} target="_blank" rel="noopener noreferrer" className="group">
        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 ${tone.ring} transition-colors`}>
          <img src={largeAvatar(who.pfp)} alt={who.name} className="w-full h-full object-cover" />
        </div>
      </a>
      <a
        href={who.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-3 text-center font-medium text-foreground ${tone.name} transition-colors`}
      >
        {who.displayName}
      </a>
      <span className={`mt-1 text-xs ${tone.platform}`}>{who.platform}</span>
      <a
        href={who.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Twitter"
      >
        <XIcon />
      </a>
    </div>
  );
}

export default function BattlePage() {
  useEffect(() => {
    document.title = TITLE;
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-3xl mx-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-foreground">Battle of the Badges</h1>
        <p className="text-center text-muted-foreground mb-8">Polymarket vs Kalshi</p>

        <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", "bg-card border-border mb-6")}>
          <div className={cn("p-6 pt-0", "pt-6")}>
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <ContestantCard who={POLY} side="poly" />
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold text-muted-foreground">VS</span>
              </div>
              <ContestantCard who={KALSHI} side="kalshi" />
            </div>
          </div>
        </div>

        <ComparisonChart polyWallet={POLY.wallet} kalshiUsername={KALSHI.kalshiUsername} polyName={POLY.displayName} kalshiName={KALSHI.displayName} />

        <a href="https://x.com/HiveLiveHQ" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center mt-8 group">
          <img
            src={HOST_AVATAR}
            alt="HiveLiveHQ"
            className="w-12 h-12 rounded-full border border-border group-hover:border-primary transition-colors"
          />
          <span className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">Hosted by HiveLiveHQ</span>
        </a>
        <ReplicaNotice />
      </div>
    </div>
  );
}
