export type Guide = {
  path: string;
  title: string;
  heading: string;
  subtitle: string;
  intro: string;
  faq: { q: string; a: string }[];
};

export const polymarketGuide: Guide = {
  path: "/polymarket",
  title: "Polymarket Leaderboard — Top Polymarket Traders by Profit | predicting.top",
  heading: "Polymarket Leaderboard",
  subtitle: "The top Polymarket traders, ranked by P&L in real time",
  intro:
    "This Polymarket leaderboard ranks the most profitable Polymarket traders by profit and loss over the last day, week, month and all time. Each trader's wallets are combined into one profile with their X account, open positions, recent trades and a P&L history chart.",
  faq: [
    {
      q: "What is the Polymarket leaderboard?",
      a: "A ranking of Polymarket traders by profit and loss (P&L). predicting.top tracks known Polymarket traders and updates their daily, weekly, monthly and all-time P&L throughout the day.",
    },
    {
      q: "How is Polymarket P&L calculated?",
      a: "From Polymarket's public profit and loss data for each wallet. When a trader uses several wallets, their P&L is added together into one profile.",
    },
    {
      q: "How is this different from the leaderboard on polymarket.com?",
      a: "Polymarket's own leaderboard lists wallets. predicting.top links wallets to the trader behind them, combines a trader's wallets, shows their P&L history over time, lets you hide sports traders, and ranks Kalshi traders alongside them.",
    },
    {
      q: "How do I get my Polymarket account on the leaderboard?",
      a: "Submit your wallet and X account on the Get Listed page. Every submission is checked before it is added.",
    },
    {
      q: "Is there a Polymarket leaderboard API?",
      a: "Yes. The predicting.top API is free, needs no key, and returns the leaderboard, trader profiles, positions and P&L history as JSON.",
    },
  ],
};

const seeAlso = "underline hover:text-foreground";

/** The "About this leaderboard" text and questions shown under a platform leaderboard. */
export function LeaderboardGuide({ guide }: { guide: Guide }) {
  const other =
    guide.path === "/kalshi"
      ? { href: "/polymarket", label: "Polymarket leaderboard" }
      : { href: "/kalshi", label: "Kalshi leaderboard" };
  return (
    <section className="mt-12 text-sm text-muted-foreground space-y-4" aria-labelledby="leaderboard-guide">
      <h2 id="leaderboard-guide" className="text-base text-foreground">About the {guide.heading}</h2>
      <p>{guide.intro}</p>
      {guide.faq.map((item) => (
        <div key={item.q}>
          <h3 className="text-foreground">{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}
      <p>
        See also: <a href="/" className={seeAlso}>prediction market leaderboard</a> · <a href={other.href} className={seeAlso}>{other.label}</a> · <a href="/submit" className={seeAlso}>Get listed</a> · <a href="/api-docs" className={seeAlso}>API</a>
      </p>
    </section>
  );
}
