// What the API docs page lists: one entry per public endpoint, in display order.
export type Endpoint = { path: string; summary: string; params?: string; example: string; fields: string[]; image?: boolean };

export const BASE_URL = "https://predicting.top";

export const ENDPOINTS: Endpoint[] = [
  {
    path: "/api/leaderboard",
    summary: "Full cross-platform leaderboard (Polymarket, Kalshi, Myriad), ranked by P&L for the period.",
    params: "period=1d|7d|30d|90d|ytd|all",
    example: "/api/leaderboard?period=7d",
    fields: ["rank", "name", "platform", "wallet", "kalshi_username", "pfp", "stats", "allTimePnl", "smart_score", "twitter", "roi", "sports_share", "day_mover"],
  },
  {
    path: "/api/embed/leaderboard",
    summary: "Compact leaderboard for embedding on your site, with profile links.",
    params: "period=1d|7d|30d|all",
    example: "/api/embed/leaderboard?period=all",
    fields: ["rank", "name", "pnl", "pfp", "profile_url", "platform", "smart_score", "win_rate", "sharpe_ratio"],
  },
  {
    path: "/api/kalshi-leaderboard",
    summary: "Kalshi-only leaderboard of the top 1,000 Kalshi traders, tracked over time.",
    params: "period=1d|7d|30d|all, limit=1-2000 (default 1000)",
    example: "/api/kalshi-leaderboard?period=30d&limit=100",
    fields: ["rank", "kalshi_username", "name", "pfp", "pnl", "pnl_all", "kalshi_url", "profile_path", "last_synced_at"],
  },
  {
    path: "/api/trader/{wallet-or-kalshi-username}",
    summary: "One trader's profile: P&L by period, wallets, linked accounts and smart score.",
    example: "/api/trader/ProbabilityDuck",
    fields: ["name", "platform", "wallet", "additional_wallets", "kalshi_username", "stats", "smart_score", "join_date", "portfolio_value"],
  },
  {
    path: "/api/trader/{wallet}/positions",
    summary: "Live open Polymarket positions for a tracked trader, largest first.",
    params: "limit=1-500, offset, sizeThreshold",
    example: "/api/trader/0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd/positions?limit=20",
    fields: ["market", "outcome", "size", "avg_price", "current_price", "current_value", "cash_pnl", "percent_pnl", "polymarket_url", "end_date"],
  },
  {
    path: "/api/trader/{wallet}/trades",
    summary: "Recent Polymarket trades for a tracked trader.",
    params: "limit=1-500, offset",
    example: "/api/trader/0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd/trades?limit=20",
    fields: ["time", "market", "type", "outcome", "amount", "price", "shares_amount", "transaction_hash", "polymarket_url"],
  },
  {
    path: "/api/kalshi/{username}/history",
    summary: "All-time P&L history for a Kalshi trader, from our snapshots.",
    example: "/api/kalshi/ProbabilityDuck/history",
    fields: ["history[].timestamp", "history[].pnl", "history[].date", "dataPoints", "firstDate", "lastDate"],
  },
  {
    path: "/api/kalshi/{username}/categories",
    summary: "A Kalshi trader's all-time P&L and markets traded by category.",
    example: "/api/kalshi/acedia/categories",
    fields: ["categories[].category", "categories[].pnl", "categories[].markets"],
  },
  {
    path: "/api/p/overview",
    summary: "Open Polymarket positions across top traders, with each trader's score.",
    example: "/api/p/overview",
    fields: ["market", "outcome", "size", "current_value", "cash_pnl", "trader_name", "trader_wallet", "trader_score", "polymarket_url"],
  },
  {
    path: "/api/m/insights",
    summary: "Markets top traders are trading most, with buy/sell and yes/no flow.",
    params: "period=1h|6h|24h|3d|1w, limit=1-200",
    example: "/api/m/insights?period=24h&limit=10",
    fields: ["market", "totalVolume", "buyVolume", "sellVolume", "yesVolume", "noVolume", "netInflow", "uniqueTraders", "yesPrice", "polymarket_url"],
  },
  {
    path: "/api/daily-profit",
    summary: "Combined profit of all tracked traders today.",
    example: "/api/daily-profit",
    fields: ["daily_profit", "raw", "traders_count"],
  },
  {
    path: "/api/kalshi-avatar/{username}",
    summary: "A Kalshi trader's profile picture (128px WebP).",
    example: "/api/kalshi-avatar/4thewin",
    fields: [],
    image: true,
  },
  {
    path: "/api/og/calendar/{wallet-or-kalshi-username}",
    summary: "Shareable month card (1080x1350): daily P&L tiles, win/loss record and monthly profit.",
    params: "month=YYYY-MM (default: current month)",
    example: "/api/og/calendar/ProbabilityDuck",
    fields: [],
    image: true,
  },
  {
    path: "/api/og/trader/{wallet-or-kalshi-username}",
    summary: "Shareable 1200x630 P&L card image for a trader.",
    example: "/api/og/trader/ProbabilityDuck",
    fields: [],
    image: true,
  },
];

export const RATE_LIMITS =
  "100 requests per minute per IP across the API (images excluded). Leaderboards allow 120/min, trader profiles 60/min per trader, positions and trades 120/min. Responses include X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset headers.";

export const EXAMPLE = `// Top 10 Kalshi traders this month
const res = await fetch("${BASE_URL}/api/kalshi-leaderboard?period=30d&limit=10");
const { traders } = await res.json();

traders.forEach(t => console.log(t.rank, t.name, t.pnl));`;
