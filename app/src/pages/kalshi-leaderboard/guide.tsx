type Guide = { path: string; heading: string; intro: string; faq: readonly { q: string; a: string }[] };

// The explanatory section under a leaderboard: intro, questions and answers, and links to the sibling pages.
export function LeaderboardGuide({ guide }: { guide: Guide }) {
  const other =
    guide.path === "/kalshi" ? { href: "/polymarket", label: "Polymarket leaderboard" } : { href: "/kalshi", label: "Kalshi leaderboard" };
  return (
    <section className="mt-12 text-sm text-muted-foreground space-y-4" aria-labelledby="leaderboard-guide">
      <h2 id="leaderboard-guide" className="text-base text-foreground">
        About the {guide.heading}
      </h2>
      <p>{guide.intro}</p>
      {guide.faq.map((item) => (
        <div key={item.q}>
          <h3 className="text-foreground">{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}
      <p>
        See also:{" "}
        <a href="/" className="underline hover:text-foreground">
          prediction market leaderboard
        </a>
        {" · "}
        <a href={other.href} className="underline hover:text-foreground">
          {other.label}
        </a>
        {" · "}
        <a href="/submit" className="underline hover:text-foreground">
          Get listed
        </a>
        {" · "}
        <a href="/api-docs" className="underline hover:text-foreground">
          API
        </a>
      </p>
    </section>
  );
}
