import { xLogo } from "@/lib/logos";

const link = "text-muted-foreground hover:text-foreground transition";

function Divider() {
  return <span className="text-border">|</span>;
}

/** The footer of the leaderboard pages. */
export function SiteFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-border">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <a
          href="https://x.com/predictingtop"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition"
        >
          <img src={xLogo} alt="X" className="w-4 h-4 object-cover" />
          <span>Our X</span>
        </a>
        <Divider />
        <a href="/submit" className={link}>Get listed</a>
        <Divider />
        <a href="/polymarket" className={link}>Polymarket leaderboard</a>
        <Divider />
        <a href="/kalshi" className={link}>Kalshi leaderboard</a>
        <Divider />
        <a href="/terms" className={link}>Terms</a>
      </div>
    </footer>
  );
}
